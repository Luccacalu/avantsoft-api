import { Test, TestingModule } from '@nestjs/testing';
import { ClientsService } from './clients.service';
import { CreateClientDto } from './dto/create-client.dto';
import { ConflictException, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { Decimal } from '@prisma/client/runtime/library';
import { PrismaService } from 'src/core/database/prisma.service';

const mockClientFindUnique = jest.fn();
const mockClientCreate = jest.fn();
const mockClientFindMany = jest.fn();
const mockClientCount = jest.fn();
const mockClientUpdate = jest.fn();
const mockClientDelete = jest.fn();
const mockSaleGroupBy = jest.fn();
const mockTransaction = jest.fn();
const mockQueryRaw = jest.fn();

const mockPrismaService = {
  client: {
    findUnique: mockClientFindUnique,
    create: mockClientCreate,
    findMany: mockClientFindMany,
    count: mockClientCount,
    update: mockClientUpdate,
    delete: mockClientDelete,
  },
  sale: {
    groupBy: mockSaleGroupBy,
  },
  $transaction: mockTransaction,
  $queryRaw: mockQueryRaw,
};

const mockClient = {
  id: 'valid-uuid',
  name: 'Fulano da Silva',
  email: 'fulano.silva@example.com',
  birthDate: new Date('2000-02-02'),
  createdAt: new Date(),
  updatedAt: new Date(),
};

describe('ClientsService', () => {
  let service: ClientsService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ClientsService,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
      ],
    }).compile();

    service = module.get<ClientsService>(ClientsService);

    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    it('should create a new client successfully', async () => {
      const createDto = {
        name: 'Fulano da Silva',
        email: 'fulano.silva@example.com',
        birthDate: '2000-02-02',
      };
      mockClientFindUnique.mockResolvedValue(null);
      mockClientCreate.mockResolvedValue(mockClient);

      const result = await service.create(createDto);

      expect(result).toEqual(mockClient);
      expect(mockClientFindUnique).toHaveBeenCalledWith({
        where: { email: createDto.email },
      });
      expect(mockClientCreate).toHaveBeenCalledWith({
        data: {
          ...createDto,
          birthDate: new Date(createDto.birthDate),
        },
      });
    });

    it('should throw a ConflictException if email is already in use', async () => {
      const createDto = {
        name: 'Fulano da Silva',
        email: 'fulano.silva@example.com',
        birthDate: '2000-02-02',
      };
      mockClientFindUnique.mockResolvedValue(mockClient);

      await expect(service.create(createDto)).rejects.toThrow(
        new ConflictException(`O e-mail "${createDto.email}" já está em uso.`),
      );
      expect(mockClientCreate).not.toHaveBeenCalled();
    });

    it('should throw a ConflictException if email is missing', async () => {
      const createDto: Partial<CreateClientDto> = {
        name: 'Fulano da Silva',
        birthDate: '2000-02-02',
      };
      // @ts-expect-error: test missing email
      await expect(service.create(createDto)).rejects.toThrow(
        new ConflictException('O campo "email" é obrigatório.'),
      );
      expect(mockClientFindUnique).not.toHaveBeenCalled();
      expect(mockClientCreate).not.toHaveBeenCalled();
    });

    it('should throw a ConflictException if name is missing', async () => {
      const createDto: Partial<CreateClientDto> = {
        email: 'fulano.silva@example.com',
        birthDate: '2000-02-02',
      };
      // @ts-expect-error: test missing name
      await expect(service.create(createDto)).rejects.toThrow(
        new ConflictException('O campo "nome" é obrigatório.'),
      );
      expect(mockClientFindUnique).not.toHaveBeenCalled();
      expect(mockClientCreate).not.toHaveBeenCalled();
    });

    it('should throw a ConflictException if birthDate is missing', async () => {
      const createDto: Partial<CreateClientDto> = {
        name: 'Fulano da Silva',
        email: 'fulano.silva@example.com',
      };
      // @ts-expect-error: test missing birthDate
      await expect(service.create(createDto)).rejects.toThrow(
        new ConflictException('O campo "nascimento" é obrigatório.'),
      );
      expect(mockClientFindUnique).not.toHaveBeenCalled();
      expect(mockClientCreate).not.toHaveBeenCalled();
    });
  });

  describe('findOne', () => {
    it('should return a single client if found', async () => {
      mockClientFindUnique.mockResolvedValue(mockClient);

      const result = await service.findOne(mockClient.id);

      expect(result).toEqual(mockClient);
      expect(mockClientFindUnique).toHaveBeenCalledWith({
        where: { id: mockClient.id },
        include: { sales: true },
      });
    });

    it('should throw a NotFoundException if client is not found', async () => {
      const invalidId = 'invalid-uuid';
      mockClientFindUnique.mockResolvedValue(null);

      await expect(service.findOne(invalidId)).rejects.toThrow(
        new NotFoundException(`Cliente com ID "${invalidId}" não encontrado.`),
      );
    });
  });

  describe('update', () => {
    it('should update a client successfully', async () => {
      const updateDto = { name: 'Fulano da Silva Updated' };
      const updatedClient = { ...mockClient, ...updateDto };
      mockClientUpdate.mockResolvedValue(updatedClient);

      const result = await service.update(mockClient.id, updateDto);

      expect(result).toEqual(updatedClient);
      expect(mockClientUpdate).toHaveBeenCalledWith({
        where: { id: mockClient.id },
        data: updateDto,
      });
    });

    it('should throw a NotFoundException when trying to update a non-existent client', async () => {
      const invalidId = 'invalid-uuid';
      const updateDto = { name: 'Fulano da Silva Updated' };
      const prismaError = new Prisma.PrismaClientKnownRequestError(
        'An operation failed because it depends on one or more records that were required but not found.',
        { code: 'P2025', clientVersion: '5.x.x' },
      );
      mockClientUpdate.mockRejectedValue(prismaError);

      await expect(service.update(invalidId, updateDto)).rejects.toThrow(
        new NotFoundException(`Cliente com ID "${invalidId}" não encontrado.`),
      );
    });
  });

  describe('remove', () => {
    it('should remove a client successfully', async () => {
      mockClientFindUnique.mockResolvedValue(mockClient);
      mockClientDelete.mockResolvedValue(mockClient);

      const result = await service.remove(mockClient.id);

      expect(result).toEqual(mockClient);
      expect(mockClientFindUnique).toHaveBeenCalledWith({
        where: { id: mockClient.id },
        include: { sales: true },
      });
      expect(mockClientDelete).toHaveBeenCalledWith({
        where: { id: mockClient.id },
      });
    });

    it('should throw a NotFoundException when trying to remove a non-existent client', async () => {
      const invalidId = 'invalid-uuid';
      mockClientFindUnique.mockResolvedValue(null);

      await expect(service.remove(invalidId)).rejects.toThrow(
        new NotFoundException(`Cliente com ID "${invalidId}" não encontrado.`),
      );
      expect(mockClientDelete).not.toHaveBeenCalled();
    });
  });

  describe('findAll', () => {
    it('should return a paginated list of clients', async () => {
      const query = { page: 1, limit: 10, name: undefined, email: undefined };
      const clients = [mockClient];
      const total = 1;
      mockTransaction.mockResolvedValue([clients, total]);

      const result = await service.findAll(query);

      expect(result.data).toEqual(clients);
      expect(result.meta.total).toBe(total);
      expect(mockTransaction).toHaveBeenCalledTimes(1);
    });

    it('should throw ConflictException if page is not a positive integer', async () => {
      const query = { page: 0, limit: 10, name: undefined, email: undefined };
      await expect(service.findAll(query as any)).rejects.toThrow(
        new ConflictException(
          'O parâmetro "page" deve ser um número inteiro positivo.',
        ),
      );
    });

    it('should throw ConflictException if limit is not a positive integer', async () => {
      const query = { page: 1, limit: 0, name: undefined, email: undefined };
      await expect(service.findAll(query as any)).rejects.toThrow(
        new ConflictException(
          'O parâmetro "limit" deve ser um número inteiro positivo.',
        ),
      );
    });

    it('should throw ConflictException if page is not an integer', async () => {
      const query = { page: 1.5, limit: 10, name: undefined, email: undefined };
      await expect(service.findAll(query as any)).rejects.toThrow(
        new ConflictException(
          'O parâmetro "page" deve ser um número inteiro positivo.',
        ),
      );
    });

    it('should throw ConflictException if limit is not an integer', async () => {
      const query = { page: 1, limit: 2.5, name: undefined, email: undefined };
      await expect(service.findAll(query as any)).rejects.toThrow(
        new ConflictException(
          'O parâmetro "limit" deve ser um número inteiro positivo.',
        ),
      );
    });
  });

  describe('getCustomReport', () => {
    it('should return a custom report with transformed client data', async () => {
      const query = { page: 1, limit: 10, name: undefined, email: undefined };
      const clientsFromDb = [
        {
          ...mockClient,
          sales: [
            {
              saleDate: new Date('2023-10-26T00:00:00.000Z'),
              value: new Decimal(100.5),
            },
          ],
        },
      ];
      const total = 1;
      mockTransaction.mockResolvedValue([clientsFromDb, total]);

      const mathRandomSpy = jest.spyOn(Math, 'random').mockReturnValue(0.6);

      const result = await service.getCustomReport(query);

      expect(result.data.clientes).toHaveLength(1);
      expect(result.data.clientes[0]).toEqual({
        info: {
          nomeCompleto: mockClient.name,
          detalhes: {
            email: mockClient.email,
            nascimento: '2000-02-02',
          },
        },
        estatisticas: {
          vendas: [{ data: '2023-10-26', valor: 100.5 }],
        },
      });
      expect(result.meta.registroTotal).toBe(total);

      mathRandomSpy.mockRestore();
    });

    it('should throw ConflictException if page is not a positive integer', async () => {
      const query = { page: 0, limit: 10, name: undefined, email: undefined };
      await expect(service.getCustomReport(query as any)).rejects.toThrow(
        new ConflictException(
          'O parâmetro "page" deve ser um número inteiro positivo.',
        ),
      );
    });

    it('should throw ConflictException if limit is not a positive integer', async () => {
      const query = { page: 1, limit: 0, name: undefined, email: undefined };
      await expect(service.getCustomReport(query as any)).rejects.toThrow(
        new ConflictException(
          'O parâmetro "limit" deve ser um número inteiro positivo.',
        ),
      );
    });

    it('should throw ConflictException if page is not an integer', async () => {
      const query = { page: 1.5, limit: 10, name: undefined, email: undefined };
      await expect(service.getCustomReport(query as any)).rejects.toThrow(
        new ConflictException(
          'O parâmetro "page" deve ser um número inteiro positivo.',
        ),
      );
    });

    it('should throw ConflictException if limit is not an integer', async () => {
      const query = { page: 1, limit: 2.5, name: undefined, email: undefined };
      await expect(service.getCustomReport(query as any)).rejects.toThrow(
        new ConflictException(
          'O parâmetro "limit" deve ser um número inteiro positivo.',
        ),
      );
    });
  });

  describe('getTopClientByTotalSales', () => {
    it('should return the client with the highest total sales', async () => {
      const groupByResult = [
        { clientId: mockClient.id, _sum: { value: new Decimal(500.75) } },
      ];
      const clientDetails = {
        id: mockClient.id,
        name: mockClient.name,
        email: mockClient.email,
      };

      mockSaleGroupBy.mockResolvedValue(groupByResult);
      mockClientFindUnique.mockResolvedValue(clientDetails);

      const result = await service.getTopClientByTotalSales();

      expect(result).toEqual({
        ...clientDetails,
        totalSalesValue: 500.75,
      });
      expect(mockSaleGroupBy).toHaveBeenCalled();
      expect(mockClientFindUnique).toHaveBeenCalledWith({
        where: { id: mockClient.id },
        select: { id: true, name: true, email: true },
      });
    });

    it('should return null if there are no sales', async () => {
      mockSaleGroupBy.mockResolvedValue([]);

      const result = await service.getTopClientByTotalSales();

      expect(result).toBeNull();
      expect(mockClientFindUnique).not.toHaveBeenCalled();
    });
  });

  describe('getTopClientByAverageSaleValue', () => {
    it('should return the client with the highest average sale value', async () => {
      const groupByResult = [
        { clientId: mockClient.id, _avg: { value: new Decimal(125.55) } },
      ];
      const clientDetails = {
        id: mockClient.id,
        name: mockClient.name,
        email: mockClient.email,
      };
      mockSaleGroupBy.mockResolvedValue(groupByResult);
      mockClientFindUnique.mockResolvedValue(clientDetails);

      const result = await service.getTopClientByAverageSaleValue();

      expect(result).toEqual({
        ...clientDetails,
        averageSaleValue: 125.55,
      });
      expect(mockSaleGroupBy).toHaveBeenCalledWith({
        by: ['clientId'],
        _avg: { value: true },
        orderBy: { _avg: { value: 'desc' } },
        take: 1,
      });
      expect(mockClientFindUnique).toHaveBeenCalledWith({
        where: { id: mockClient.id },
        select: { id: true, name: true, email: true },
      });
    });

    it('should return null if there are no sales to average', async () => {
      mockSaleGroupBy.mockResolvedValue([]);

      const result = await service.getTopClientByAverageSaleValue();

      expect(result).toBeNull();
    });
  });

  describe('getTopClientByPurchaseFrequency', () => {
    it('should return clients with the highest purchase frequency', async () => {
      const rawQueryResult = [{ clientId: mockClient.id, uniqueSaleDays: 3n }];
      const clientDetails = [
        { id: mockClient.id, name: mockClient.name, email: mockClient.email },
      ];

      mockQueryRaw.mockResolvedValue(rawQueryResult);
      mockClientFindMany.mockResolvedValue(clientDetails);

      const result = await service.getTopClientByPurchaseFrequency();

      expect(result).toEqual([
        {
          ...clientDetails[0],
          uniqueSaleDays: 3,
        },
      ]);
      expect(mockQueryRaw).toHaveBeenCalled();
      expect(mockClientFindMany).toHaveBeenCalledWith({
        where: { id: { in: [mockClient.id] } },
        select: { id: true, name: true, email: true },
      });
    });

    it('should return an empty array if no data is found', async () => {
      mockQueryRaw.mockResolvedValue([]);

      const result = await service.getTopClientByPurchaseFrequency();

      expect(result).toEqual([]);
      expect(mockClientFindMany).not.toHaveBeenCalled();
    });
  });
});
