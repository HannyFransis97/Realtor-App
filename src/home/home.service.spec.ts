import { Test, TestingModule } from '@nestjs/testing';
import { HomeService, homeSelect } from './home.service';
// import { PrismaService } from 'src/prisma/prisma.service';
import { PrismaService } from '../prisma/prisma.service';
import { PropertyType } from '@prisma/client';
import { NotFoundException } from '@nestjs/common';

const mockGetHomes = [
  {
    id: 1,
    address: '1234 Al-Souq',
    city: 'Yabroud',
    price: 1500000,
    property_type: PropertyType.RESIDENTIAL,
    number_of_bedrooms: 4,
    number_of_bathrooms: 2,
    image: 'img1',
    images: [{ url: 'img1' }],
  },
];

const mockHome = {
  id: 1,
  address: '1234 Al-Souq',
  city: 'Yabroud',
  price: 1500000,
  property_type: PropertyType.RESIDENTIAL,
  number_of_bedrooms: 4,
  number_of_bathrooms: 2,
};

const mockImages = [
  {
    id: 1,
    url: 'src1',
  },
  {
    id: 2,
    url: 'src2',
  },
];

describe('HomeService', () => {
  let service: HomeService;
  let prismaService: PrismaService;
  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        HomeService,
        {
          provide: PrismaService,
          useValue: {
            home: {
              findMany: jest.fn().mockReturnValue(mockGetHomes),
              create: jest.fn().mockReturnValue(mockHome),
            },
            image: {
              createMany: jest.fn().mockReturnValue(mockImages),
            },
          },
        },
      ],
    }).compile();

    service = module.get<HomeService>(HomeService);
    prismaService = module.get<PrismaService>(PrismaService);
  });

  describe('getHomes', () => {
    const filters = {
      city: 'Yabroud',
      price: {
        gte: 1000000,
        lte: 1500000,
      },
      PropertyType: PropertyType.RESIDENTIAL,
    };

    it('should call pirsma home.findMany with correct params', async () => {
      const mockPrismaFindManyHomes = jest.fn().mockReturnValue(mockGetHomes);
      jest
        .spyOn(prismaService.home, 'findMany')
        .mockImplementation(mockPrismaFindManyHomes);

      await service.getHomes(filters);

      expect(mockPrismaFindManyHomes).toBeCalledWith({
        select: {
          ...homeSelect,
          images: {
            select: {
              url: true,
            },
            take: 1,
          },
        },
        where: filters,
      });
    });

    it('should throw not found exception if no homes are found', async () => {
      const mockPrismaFindManyHomes = jest.fn().mockReturnValue([]);
      jest
        .spyOn(prismaService.home, 'findMany')
        .mockImplementation(mockPrismaFindManyHomes);

      await expect(service.getHomes(filters)).rejects.toThrowError(
        NotFoundException,
      );
    });
  });

  describe('createHome', () => {
    const mockCreateHomeParams = {
      address: '111 Yellow str',
      numberOfBathrooms: 2,
      numberOfBedrooms: 2,
      city: 'Yabroud',
      price: 150000,
      landSize: 3412,
      propertyType: PropertyType.CONDO,
      images: [
        {
          url: 'img-1',
        },
      ],
    };
    it('should call prisma home.create with the correct payload', async () => {
      const mockCreateHome = jest.fn().mockReturnValue(mockHome);

      jest
        .spyOn(prismaService.home, 'create')
        .mockImplementation(mockCreateHome);

      await service.createHome(mockCreateHomeParams, 5);

      expect(mockCreateHome).toBeCalledWith({
        data: {
          address: '111 Yellow str',
          number_of_bathrooms: 2,
          number_of_bedrooms: 2,
          city: 'Yabroud',
          price: 150000,
          land_size: 3412,
          propertyType: PropertyType.CONDO,
          realtor_id: 5,
        },
      });
    });

    it('should call prisma image.createMany with the correct payloa', async () => {
      const mockCreateManyImages = jest.fn().mockReturnValue(mockImages);

      jest
        .spyOn(prismaService.image, 'createMany')
        .mockImplementation(mockCreateManyImages);

      await service.createHome(mockCreateHomeParams, 5);

      expect(mockCreateManyImages).toBeCalledWith({
        data: [{ home_id: 1, url: 'img-1' }],
      });
    });
  });
});
