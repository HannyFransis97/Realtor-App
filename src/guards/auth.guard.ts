import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import * as jwt from 'jsonwebtoken';
// import { PrismaService } from 'src/prisma/prisma.service';
import { PrismaService } from '../prisma/prisma.service';

interface JWTPayload {
  id: number;
  name: string;
  iat: number;
  exp: number;
}

@Injectable()
export class AuthGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly prismaService: PrismaService,
  ) {}
  async canActivate(context: ExecutionContext): Promise<boolean> {
    // 1) Determine the userYypes that can execute the endpoint
    const roles = this.reflector.getAllAndOverride('roles', [
      context.getHandler(),
      context.getClass(),
    ]);
    console.log(roles);

    if (roles?.length) {
      // 2) Grab the JWT from the request header and verify it
      const request = context.switchToHttp().getRequest();
      const token = request.headers?.authorization?.split('Bearer ')[1];
      try {
        const payload = (await jwt.verify(
          token,
          process.env.JSON_TOKEN_KEY,
        )) as JWTPayload;

        // 3) Database request to get user by id
        const user = await this.prismaService.user.findUnique({
          where: { id: payload.id },
        });

        if (!user) return false;
        // 4) Determine if the user had permission
        if (roles.includes(user.user_type)) return true;

        return false;
      } catch (error) {
        return false;
      }
    }
    return true;
  }
}
