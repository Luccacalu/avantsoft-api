import { Test, TestingModule } from '@nestjs/testing';
import { SalesController } from './sales.controller';
import { SalesService } from './sales.service';
import { CreateSaleDto } from './dto/create-sale.dto';
import { UpdateSaleDto } from './dto/update-sale.dto';
import { SalesStatsQueryDto } from './dto/sales-stats-query.dto';
import {
  UnprocessableEntityException,
  NotFoundException,
} from '@nestjs/common';

describe('SalesController', () => {
  let controller: SalesController;

  const mockService = {
    create: jest.fn(),
    findAll: jest.fn(),
    findOne: jest.fn(),
    update: jest.fn(),
    remove: jest.fn(),
    getSalesPerDay: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [SalesController],
      providers: [
        {
          provide: SalesService,
          useValue: mockService,
        },
      ],
    }).compile();

    controller = module.get<SalesController>(SalesController);
    jest.clearAllMocks();
  });

  describe('create', () => {
    it('should create a sale', async () => {
      const dto: CreateSaleDto = {
        value: 100,
        clientId: 'client-uuid',
        saleDate: '2025-08-14T10:00:00Z',
      };
      mockService.create.mockResolvedValue({ id: 1, ...dto });
      const result = await controller.create(dto);
      expect(result).toEqual({ id: 1, ...dto });
      expect(mockService.create).toHaveBeenCalledWith(dto);
    });

    it('should propagate UnprocessableEntityException from service', async () => {
      const dto: CreateSaleDto = {
        value: 100,
        clientId: 'client-uuid',
      };
      mockService.create.mockRejectedValue(
        new UnprocessableEntityException('O cliente informado não existe.'),
      );
      await expect(controller.create(dto)).rejects.toThrow(
        UnprocessableEntityException,
      );
    });
  });

  describe('findAll', () => {
    it('should return all sales', async () => {
      const sales = [{ id: 1, value: 100 }];
      mockService.findAll.mockResolvedValue(sales);
      const result = await controller.findAll();
      expect(result).toEqual(sales);
      expect(mockService.findAll).toHaveBeenCalled();
    });
  });

  describe('findOne', () => {
    it('should return sale by id', async () => {
      const sale = { id: 1, value: 100 };
      mockService.findOne.mockResolvedValue(sale);
      const result = await controller.findOne(1);
      expect(result).toEqual(sale);
      expect(mockService.findOne).toHaveBeenCalledWith(1);
    });

    it('should propagate NotFoundException from service', async () => {
      mockService.findOne.mockRejectedValue(
        new NotFoundException('Venda não encontrada.'),
      );
      await expect(controller.findOne(1)).rejects.toThrow(NotFoundException);
    });
  });

  describe('update', () => {
    it('should update sale', async () => {
      const dto: UpdateSaleDto = { value: 200 };
      mockService.update.mockResolvedValue({ id: 1, ...dto });
      const result = await controller.update(1, dto);
      expect(result).toEqual({ id: 1, ...dto });
      expect(mockService.update).toHaveBeenCalledWith(1, dto);
    });

    it('should propagate UnprocessableEntityException from service', async () => {
      const dto: UpdateSaleDto = { value: 200 };
      mockService.update.mockRejectedValue(
        new UnprocessableEntityException('Valor inválido.'),
      );
      await expect(controller.update(1, dto)).rejects.toThrow(
        UnprocessableEntityException,
      );
    });

    it('should propagate NotFoundException from service', async () => {
      const dto: UpdateSaleDto = { value: 200 };
      mockService.update.mockRejectedValue(
        new NotFoundException('Venda não encontrada.'),
      );
      await expect(controller.update(1, dto)).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('remove', () => {
    it('should remove sale', async () => {
      mockService.remove.mockResolvedValue({ id: 1 });
      const result = await controller.remove(1);
      expect(result).toEqual({ id: 1 });
      expect(mockService.remove).toHaveBeenCalledWith(1);
    });

    it('should propagate NotFoundException from service', async () => {
      mockService.remove.mockRejectedValue(
        new NotFoundException('Venda não encontrada.'),
      );
      await expect(controller.remove(1)).rejects.toThrow(NotFoundException);
    });
  });

  describe('getSalesStats', () => {
    it('should return sales stats per day', async () => {
      const query: SalesStatsQueryDto = {};
      const stats = [
        { date: '2025-08-13', total: 2 },
        { date: '2025-08-14', total: 1 },
      ];
      mockService.getSalesPerDay.mockResolvedValue(stats);
      const result = await controller.getSalesStats(query);
      expect(result).toEqual(stats);
      expect(mockService.getSalesPerDay).toHaveBeenCalledWith(query);
    });

    it('should handle filters in query', async () => {
      const query: SalesStatsQueryDto = {
        lastMonths: 2,
        startDate: '2025-08-01',
        endDate: '2025-08-14',
        year: 2025,
        month: 8,
      };
      mockService.getSalesPerDay.mockResolvedValue([]);
      await controller.getSalesStats(query);
      expect(mockService.getSalesPerDay).toHaveBeenCalledWith(query);
    });
  });
});
