import { Test, TestingModule } from '@nestjs/testing';
import { ClientsController } from './clients.controller';
import { ClientsService } from './clients.service';
import { ConflictException, NotFoundException } from '@nestjs/common';
import { CreateClientDto } from './dto/create-client.dto';
import { UpdateClientDto } from './dto/update-client.dto';
import { FindClientsQueryDto } from './dto/find-clients-query.dto';

const mockClientsService = {
  create: jest.fn(),
  findAll: jest.fn(),
  findOne: jest.fn(),
  update: jest.fn(),
  remove: jest.fn(),
  getCustomReport: jest.fn(),
  getTopClientByTotalSales: jest.fn(),
  getTopClientByAverageSaleValue: jest.fn(),
  getTopClientByPurchaseFrequency: jest.fn(),
};

describe('ClientsController', () => {
  let controller: ClientsController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ClientsController],
      providers: [
        {
          provide: ClientsService,
          useValue: mockClientsService,
        },
      ],
    }).compile();

    controller = module.get<ClientsController>(ClientsController);
    jest.clearAllMocks();
  });

  describe('findAll', () => {
    it('should return paginated clients for valid params', async () => {
      const query: FindClientsQueryDto = { page: 1, limit: 10 };
      const result = {
        data: [],
        meta: { total: 0, page: 1, lastPage: 1, limit: 10 },
      };
      mockClientsService.findAll.mockResolvedValue(result);
      expect(await controller.findAll(query)).toBe(result);
      expect(mockClientsService.findAll).toHaveBeenCalledWith(query);
    });

    it('should propagate ConflictException for invalid page', async () => {
      const query: FindClientsQueryDto = { page: 0, limit: 10 };
      mockClientsService.findAll.mockRejectedValue(
        new ConflictException(
          'O parâmetro "page" deve ser um número inteiro positivo.',
        ),
      );
      await expect(controller.findAll(query)).rejects.toThrow(
        ConflictException,
      );
    });

    it('should propagate ConflictException for invalid limit', async () => {
      const query: FindClientsQueryDto = { page: 1, limit: 0 };
      mockClientsService.findAll.mockRejectedValue(
        new ConflictException(
          'O parâmetro "limit" deve ser um número inteiro positivo.',
        ),
      );
      await expect(controller.findAll(query)).rejects.toThrow(
        ConflictException,
      );
    });
  });

  describe('getCustomReport', () => {
    it('should return custom report for valid params', async () => {
      const query: FindClientsQueryDto = { page: 1, limit: 10 };
      const result = {
        data: { clientes: [] },
        meta: { registroTotal: 0, pagina: 1, limite: 10, ultimaPagina: 1 },
        redundante: { status: 'ok' },
      };
      mockClientsService.getCustomReport.mockResolvedValue(result);
      expect(await controller.getCustomReport(query)).toBe(result);
      expect(mockClientsService.getCustomReport).toHaveBeenCalledWith(query);
    });

    it('should propagate ConflictException for invalid page', async () => {
      const query: FindClientsQueryDto = { page: 0, limit: 10 };
      mockClientsService.getCustomReport.mockRejectedValue(
        new ConflictException(
          'O parâmetro "page" deve ser um número inteiro positivo.',
        ),
      );
      await expect(controller.getCustomReport(query)).rejects.toThrow(
        ConflictException,
      );
    });

    it('should propagate ConflictException for invalid limit', async () => {
      const query: FindClientsQueryDto = { page: 1, limit: 0 };
      mockClientsService.getCustomReport.mockRejectedValue(
        new ConflictException(
          'O parâmetro "limit" deve ser um número inteiro positivo.',
        ),
      );
      await expect(controller.getCustomReport(query)).rejects.toThrow(
        ConflictException,
      );
    });
  });

  describe('create', () => {
    it('should call service.create and return result', async () => {
      const dto: CreateClientDto = {
        name: 'Test',
        email: 'test@email.com',
        birthDate: '2000-01-01',
      };
      const result = { id: 'uuid', ...dto };
      mockClientsService.create.mockResolvedValue(result);
      expect(await controller.create(dto)).toBe(result);
      expect(mockClientsService.create).toHaveBeenCalledWith(dto);
    });
    it('should propagate ConflictException from service', async () => {
      const dto: CreateClientDto = {
        name: 'Test',
        email: 'test@email.com',
        birthDate: '2000-01-01',
      };
      mockClientsService.create.mockRejectedValue(
        new ConflictException('O campo "email" é obrigatório.'),
      );
      await expect(controller.create(dto)).rejects.toThrow(ConflictException);
    });
  });

  describe('findOne', () => {
    it('should call service.findOne and return result', async () => {
      const result = {
        id: 'uuid',
        name: 'Test',
        email: 'test@email.com',
        birthDate: '2000-01-01',
      };
      mockClientsService.findOne.mockResolvedValue(result);
      expect(await controller.findOne('uuid')).toBe(result);
      expect(mockClientsService.findOne).toHaveBeenCalledWith('uuid');
    });
    it('should propagate NotFoundException from service', async () => {
      mockClientsService.findOne.mockRejectedValue(
        new NotFoundException('Cliente não encontrado.'),
      );
      await expect(controller.findOne('uuid')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('update', () => {
    it('should call service.update and return result', async () => {
      const dto: UpdateClientDto = { name: 'Updated' };
      const result = {
        id: 'uuid',
        name: 'Updated',
        email: 'test@email.com',
        birthDate: '2000-01-01',
      };
      mockClientsService.update.mockResolvedValue(result);
      expect(await controller.update('uuid', dto)).toBe(result);
      expect(mockClientsService.update).toHaveBeenCalledWith('uuid', dto);
    });
    it('should propagate NotFoundException from service', async () => {
      const dto: UpdateClientDto = { name: 'Updated' };
      mockClientsService.update.mockRejectedValue(
        new NotFoundException('Cliente não encontrado.'),
      );
      await expect(controller.update('uuid', dto)).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('remove', () => {
    it('should call service.remove and return result', async () => {
      const result = {
        id: 'uuid',
        name: 'Test',
        email: 'test@email.com',
        birthDate: '2000-01-01',
      };
      mockClientsService.remove.mockResolvedValue(result);
      expect(await controller.remove('uuid')).toBe(result);
      expect(mockClientsService.remove).toHaveBeenCalledWith('uuid');
    });
    it('should propagate NotFoundException from service', async () => {
      mockClientsService.remove.mockRejectedValue(
        new NotFoundException('Cliente não encontrado.'),
      );
      await expect(controller.remove('uuid')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('getTopClientByTotalSales', () => {
    it('should call service.getTopClientByTotalSales and return result', async () => {
      const result = {
        id: 'uuid',
        name: 'Test',
        email: 'test@email.com',
        totalSalesValue: 100,
      };
      mockClientsService.getTopClientByTotalSales.mockResolvedValue(result);
      expect(await controller.getTopClientByTotalSales()).toBe(result);
      expect(mockClientsService.getTopClientByTotalSales).toHaveBeenCalled();
    });
  });

  describe('getTopClientByAverageSaleValue', () => {
    it('should call service.getTopClientByAverageSaleValue and return result', async () => {
      const result = {
        id: 'uuid',
        name: 'Test',
        email: 'test@email.com',
        averageSaleValue: 50,
      };
      mockClientsService.getTopClientByAverageSaleValue.mockResolvedValue(
        result,
      );
      expect(await controller.getTopClientByAverageSaleValue()).toBe(result);
      expect(
        mockClientsService.getTopClientByAverageSaleValue,
      ).toHaveBeenCalled();
    });
  });

  describe('getTopClientByPurchaseFrequency', () => {
    it('should call service.getTopClientByPurchaseFrequency and return result', async () => {
      const result = [
        {
          id: 'uuid',
          name: 'Test',
          email: 'test@email.com',
          uniqueSaleDays: 5,
        },
      ];
      mockClientsService.getTopClientByPurchaseFrequency.mockResolvedValue(
        result,
      );
      expect(await controller.getTopClientByPurchaseFrequency()).toBe(result);
      expect(
        mockClientsService.getTopClientByPurchaseFrequency,
      ).toHaveBeenCalled();
    });
  });
});
