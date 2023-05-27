import { Test, TestingModule } from '@nestjs/testing';
import { HomeController } from './home.controller';
import { HomeService } from './home.service';
import { PrismaService } from '../prisma/prisma.service';
import { PropertyType } from '@prisma/client';
import { UnauthorizedException } from '@nestjs/common';

const mockUser = {
  id: 53,
  name: 'hanny',
  email: 'hanny@gmail.com',
  phone: '0123456789',
};

const mockHome = {
  id: 1,
  address: '1234 Al-Souq',
  city: 'Yabroud',
  price: 1500000,
  property_type: PropertyType.RESIDENTIAL,
  number_of_bedrooms: 4,
  number_of_bathrooms: 2,
};

describe('HomeController', () => {
  let controller: HomeController;
  let homeService: HomeService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [HomeController],
      providers: [
        {
          provide: HomeService,
          useValue: {
            getHomes: jest.fn().mockReturnValue([]),
            getRealtorByHomeId: jest.fn().mockReturnValue(mockUser),
            updateHomeById: jest.fn().mockReturnValue(mockHome),
          },
        },
        PrismaService,
      ],
    }).compile();

    controller = module.get<HomeController>(HomeController);
    homeService = module.get<HomeService>(HomeService);
  });

  describe('getHomes', () => {
    it('should construct object filter corrcetly', async () => {
      const mockGetHomes = jest.fn().mockReturnValue([]);

      jest.spyOn(homeService, 'getHomes').mockImplementation(mockGetHomes);
      await controller.getHomes('Yabroud', '12000');

      expect(mockGetHomes).toBeCalledWith({
        city: 'Yabroud',
        price: { gte: 12000 },
      });
    });

    describe('updateHome', () => {
      const mockUserInfo = {
        name: 'hanny',
        id: 30,
        iat: 1,
        exp: 23000,
      };

      const mockUpdateHomeParams = {
        address: '111 Yellow str',
        numberOfBathrooms: 2,
        numberOfBedrooms: 2,
        city: 'Yabroud',
        price: 150000,
        landSize: 3412,
        propertyType: PropertyType.CONDO,
      };

      it('should throw unauth error if realtor did not create home', async () => {
        await expect(
          controller.updateHome(5, mockUpdateHomeParams, mockUserInfo),
        ).rejects.toThrowError(UnauthorizedException);
      });

      it('should update home if realtor id is valid', async () => {
        const mockUpdateHome = jest.fn().mockReturnValue(mockHome);

        jest
          .spyOn(homeService, 'updateHomeById')
          .mockImplementation(mockUpdateHome);

        await controller.updateHome(5, mockUpdateHomeParams, {
          ...mockUserInfo,
          id: 53,
        });
        expect(mockUpdateHome).toBeCalled();
      });
    });
  });
});
