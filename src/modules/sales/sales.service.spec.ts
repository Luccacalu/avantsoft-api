import { Test, TestingModule } from '@nestjs/testing';
import { SalesService } from './sales.service';
import { PrismaService } from 'src/core/database/prisma.service';
import {
  UnprocessableEntityException,
  NotFoundException,
} from '@nestjs/common';
import { CreateSaleDto } from './dto/create-sale.dto';
import { UpdateSaleDto } from './dto/update-sale.dto';
import { SalesStatsQueryDto } from './dto/sales-stats-query.dto';

const mockPrisma = {
  sale: {
    create: jest.fn(),
    findMany: jest.fn(),
    findUnique: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
  },
  client: {
    findUnique: jest.fn(),
  },
  $queryRaw: jest.fn(),
};

describe('SalesService', () => {
  let service: SalesService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SalesService,
        {
          provide: PrismaService,
          useValue: mockPrisma,
        },
      ],
    }).compile();

    service = module.get<SalesService>(SalesService);
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    it('should throw UnprocessableEntityException if value is not a number', async () => {
      mockPrisma.client.findUnique.mockResolvedValue({ id: 'client-uuid' });
      await expect(
        // @ts-expect-error: testando valor não numérico
        service.create({ value: 'abc', clientId: 'client-uuid' }),
      ).rejects.toThrow(
        new UnprocessableEntityException(
          'O valor da venda deve ser um número.',
        ),
      );
    });

    it('should throw UnprocessableEntityException if value is negative', async () => {
      const dto = { value: -10, clientId: 'client-uuid' };
      mockPrisma.client.findUnique.mockResolvedValue({ id: dto.clientId });
      await expect(service.create(dto)).rejects.toThrow(
        new UnprocessableEntityException('O valor da venda deve ser positivo.'),
      );
    });

    it('should throw UnprocessableEntityException if value has more than 2 decimal places', async () => {
      const dto = { value: 10.123, clientId: 'client-uuid' };
      mockPrisma.client.findUnique.mockResolvedValue({ id: 'client-uuid' });
      await expect(service.create(dto)).rejects.toThrow(
        new UnprocessableEntityException(
          'O valor da venda deve ter no máximo 2 casas decimais.',
        ),
      );
    });
    it('should create a sale for an existing client', async () => {
      const dto: CreateSaleDto = {
        value: 100,
        clientId: 'client-uuid',
        saleDate: '2025-08-14T10:00:00Z',
      };
      mockPrisma.client.findUnique.mockResolvedValue({ id: dto.clientId });
      mockPrisma.sale.create.mockResolvedValue({ id: 1, ...dto });
      const result = await service.create(dto);
      expect(result).toEqual({ id: 1, ...dto });
      expect(mockPrisma.client.findUnique).toHaveBeenCalledWith({
        where: { id: dto.clientId },
      });
      expect(mockPrisma.sale.create).toHaveBeenCalled();
    });

    it('should throw UnprocessableEntityException if client does not exist', async () => {
      const dto: CreateSaleDto = {
        value: 100,
        clientId: 'client-uuid',
      };
      mockPrisma.client.findUnique.mockResolvedValue(null);
      await expect(service.create(dto)).rejects.toThrow(
        new UnprocessableEntityException(
          `O cliente com ID "${dto.clientId}" não existe.`,
        ),
      );
      expect(mockPrisma.sale.create).not.toHaveBeenCalled();
    });
  });

  describe('findAll', () => {
    it('should return all sales with client info', async () => {
      const sales = [
        {
          id: 1,
          value: 100,
          client: { id: 'client-uuid', name: 'Test', email: 'test@email.com' },
        },
      ];
      mockPrisma.sale.findMany.mockResolvedValue(sales);
      const result = await service.findAll();
      expect(result).toEqual(sales);
      expect(mockPrisma.sale.findMany).toHaveBeenCalledWith({
        include: {
          client: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
        },
      });
    });
  });

  describe('findOne', () => {
    it('should return sale if found', async () => {
      const sale = { id: 1, value: 100, client: { id: 'client-uuid' } };
      mockPrisma.sale.findUnique.mockResolvedValue(sale);
      const result = await service.findOne(1);
      expect(result).toEqual(sale);
      expect(mockPrisma.sale.findUnique).toHaveBeenCalledWith({
        where: { id: 1 },
        include: { client: true },
      });
    });

    it('should throw NotFoundException if sale not found', async () => {
      mockPrisma.sale.findUnique.mockResolvedValue(null);
      await expect(service.findOne(1)).rejects.toThrow(
        new NotFoundException('Venda com ID #1 não encontrada.'),
      );
    });
  });

  describe('update', () => {
    it('should throw UnprocessableEntityException if value is not a number', async () => {
      mockPrisma.sale.findUnique.mockResolvedValue({ id: 1 });
      await expect(
        // @ts-expect-error: testando valor não numérico
        service.update(1, { value: 'abc' }),
      ).rejects.toThrow(
        new UnprocessableEntityException(
          'O valor da venda deve ser um número.',
        ),
      );
    });

    it('should throw UnprocessableEntityException if value is negative', async () => {
      mockPrisma.sale.findUnique.mockResolvedValue({ id: 1 });
      const dto = { value: -10 };
      await expect(service.update(1, dto)).rejects.toThrow(
        new UnprocessableEntityException('O valor da venda deve ser positivo.'),
      );
    });

    it('should throw UnprocessableEntityException if value has more than 2 decimal places', async () => {
      mockPrisma.sale.findUnique.mockResolvedValue({ id: 1 });
      const dto = { value: 10.123 };
      await expect(service.update(1, dto)).rejects.toThrow(
        new UnprocessableEntityException(
          'O valor da venda deve ter no máximo 2 casas decimais.',
        ),
      );
    });
    it('should update sale if found and client exists', async () => {
      const dto: UpdateSaleDto = { value: 200, clientId: 'client-uuid' };
      mockPrisma.sale.findUnique.mockResolvedValue({ id: 1 });
      mockPrisma.client.findUnique.mockResolvedValue({ id: dto.clientId });
      mockPrisma.sale.update.mockResolvedValue({ id: 1, ...dto });
      const result = await service.update(1, dto);
      expect(result).toEqual({ id: 1, ...dto });
      expect(mockPrisma.sale.update).toHaveBeenCalled();
    });

    it('should throw NotFoundException if sale not found', async () => {
      mockPrisma.sale.findUnique.mockResolvedValue(null);
      const dto: UpdateSaleDto = { value: 200 };
      await expect(service.update(1, dto)).rejects.toThrow(
        new NotFoundException('Venda com ID #1 não encontrada.'),
      );
      expect(mockPrisma.sale.update).not.toHaveBeenCalled();
    });

    it('should throw UnprocessableEntityException if client does not exist', async () => {
      mockPrisma.sale.findUnique.mockResolvedValue({ id: 1 });
      const dto: UpdateSaleDto = { value: 200, clientId: 'client-uuid' };
      mockPrisma.client.findUnique.mockResolvedValue(null);
      await expect(service.update(1, dto)).rejects.toThrow(
        new UnprocessableEntityException(
          `O cliente com ID "${dto.clientId}" não existe.`,
        ),
      );
      expect(mockPrisma.sale.update).not.toHaveBeenCalled();
    });
  });

  describe('remove', () => {
    it('should remove sale if found', async () => {
      mockPrisma.sale.findUnique.mockResolvedValue({ id: 1 });
      mockPrisma.sale.delete.mockResolvedValue({ id: 1 });
      const result = await service.remove(1);
      expect(result).toEqual({ id: 1 });
      expect(mockPrisma.sale.delete).toHaveBeenCalledWith({ where: { id: 1 } });
    });

    it('should throw NotFoundException if sale not found', async () => {
      mockPrisma.sale.findUnique.mockResolvedValue(null);
      await expect(service.remove(1)).rejects.toThrow(
        new NotFoundException('Venda com ID #1 não encontrada.'),
      );
      expect(mockPrisma.sale.delete).not.toHaveBeenCalled();
    });
  });

  describe('getSalesPerDay', () => {
    it('should return sales per day with no filters', async () => {
      const query: SalesStatsQueryDto = {};
      const rawResult = [
        { date: new Date('2025-08-13'), total: 2 },
        { date: new Date('2025-08-14'), total: 1 },
      ];
      mockPrisma.$queryRaw.mockResolvedValue(rawResult);
      const result = await service.getSalesPerDay(query);
      expect(result).toEqual([
        { date: '2025-08-13', total: 2 },
        { date: '2025-08-14', total: 1 },
      ]);
      expect(mockPrisma.$queryRaw).toHaveBeenCalled();
    });

    it('should handle filters: lastMonths, startDate, endDate, year, month', async () => {
      const query: SalesStatsQueryDto = {
        lastMonths: 2,
        startDate: '2025-08-01',
        endDate: '2025-08-14',
        year: 2025,
        month: 8,
      };
      mockPrisma.$queryRaw.mockResolvedValue([]);
      await service.getSalesPerDay(query);
      expect(mockPrisma.$queryRaw).toHaveBeenCalled();
    });
  });
});
