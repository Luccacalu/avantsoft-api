import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { CreateClientDto } from './dto/create-client.dto';
import { UpdateClientDto } from './dto/update-client.dto';
import { Prisma } from '@prisma/client';
import { PrismaService } from 'src/core/database/prisma.service';
import { FindClientsQueryDto } from './dto/find-clients-query.dto';

@Injectable()
export class ClientsService {
  constructor(private prisma: PrismaService) {}

  async create(createClientDto: CreateClientDto) {
    const existingClient = await this.prisma.client.findUnique({
      where: { email: createClientDto.email },
    });

    if (existingClient) {
      throw new ConflictException(
        `O e-mail "${createClientDto.email}" já está em uso.`,
      );
    }

    const birthDate = new Date(createClientDto.birthDate);
    return this.prisma.client.create({
      data: {
        ...createClientDto,
        birthDate,
      },
    });
  }

  async findAll(query: FindClientsQueryDto) {
    const { name, email, page, limit } = query;
    const skip = (page - 1) * limit;

    const where: Prisma.ClientWhereInput = {
      ...(name && {
        name: { contains: name, mode: Prisma.QueryMode.insensitive },
      }),
      ...(email && {
        email: { contains: email, mode: Prisma.QueryMode.insensitive },
      }),
    };

    const [data, total] = await this.prisma.$transaction([
      this.prisma.client.findMany({
        where,
        include: { sales: true },
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.client.count({ where }),
    ]);

    return {
      data,
      meta: {
        total,
        page,
        lastPage: Math.ceil(total / limit),
        limit,
      },
    };
  }

  async findOne(id: string) {
    const client = await this.prisma.client.findUnique({
      where: { id },
      include: { sales: true },
    });

    if (!client) {
      throw new NotFoundException(`Cliente com ID "${id}" não encontrado.`);
    }

    return client;
  }

  async update(id: string, updateClientDto: UpdateClientDto) {
    try {
      const data = updateClientDto.birthDate
        ? { ...updateClientDto, birthDate: new Date(updateClientDto.birthDate) }
        : updateClientDto;

      return await this.prisma.client.update({
        where: { id },
        data,
      });
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2025'
      ) {
        throw new NotFoundException(`Cliente com ID "${id}" não encontrado.`);
      }
      throw error;
    }
  }

  async remove(id: string) {
    await this.findOne(id);

    return this.prisma.client.delete({
      where: { id },
    });
  }

  async getCustomReport(query: FindClientsQueryDto) {
    const { name, email, page, limit } = query;
    const skip = (page - 1) * limit;

    const where: Prisma.ClientWhereInput = {
      ...(name && {
        name: { contains: name, mode: Prisma.QueryMode.insensitive },
      }),
      ...(email && {
        email: { contains: email, mode: Prisma.QueryMode.insensitive },
      }),
    };

    const [clientsFromDb, total] = await this.prisma.$transaction([
      this.prisma.client.findMany({
        where,
        include: {
          sales: {
            orderBy: {
              saleDate: 'asc',
            },
          },
        },
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.client.count({ where }),
    ]);

    const transformedClients = clientsFromDb.map((client) => {
      const duplicateField =
        Math.random() < 0.5 ? { duplicado: { nomeCompleto: client.name } } : {};

      return {
        info: {
          nomeCompleto: client.name,
          detalhes: {
            email: client.email,
            nascimento: client.birthDate.toISOString().split('T')[0],
          },
        },
        ...duplicateField,
        estatisticas: {
          vendas: client.sales.map((sale) => ({
            data: sale.saleDate.toISOString().split('T')[0],
            valor: sale.value.toNumber(),
          })),
        },
      };
    });

    return {
      data: {
        clientes: transformedClients,
      },
      meta: {
        registroTotal: total,
        pagina: page,
        limite: limit,
        ultimaPagina: Math.ceil(total / limit),
      },
      redundante: {
        status: 'ok',
      },
    };
  }

  async getTopClientByTotalSales() {
    const result = await this.prisma.sale.groupBy({
      by: ['clientId'],
      _sum: { value: true },
      orderBy: { _sum: { value: 'desc' } },
      take: 1,
    });

    if (result.length === 0) return null;

    const totalSales = result[0]._sum.value;

    if (totalSales === null) return null;

    const client = await this.prisma.client.findUnique({
      where: { id: result[0].clientId },
      select: { id: true, name: true, email: true },
    });

    return {
      ...client,
      totalSalesValue: parseFloat(totalSales.toFixed(2)),
    };
  }

  async getTopClientByAverageSaleValue() {
    const result = await this.prisma.sale.groupBy({
      by: ['clientId'],
      _avg: { value: true },
      orderBy: { _avg: { value: 'desc' } },
      take: 1,
    });

    if (result.length === 0) return null;

    const averageValue = result[0]._avg.value;

    if (averageValue === null) return null;

    const client = await this.prisma.client.findUnique({
      where: { id: result[0].clientId },
      select: { id: true, name: true, email: true },
    });

    return {
      ...client,
      averageSaleValue: parseFloat(averageValue.toFixed(2)),
    };
  }

  async getTopClientByPurchaseFrequency() {
    const topClientsData: { clientId: string; uniqueSaleDays: bigint }[] =
      await this.prisma.$queryRaw`
        WITH "ClientFrequency" AS (
          SELECT 
            "client_id" AS "clientId", 
            COUNT(DISTINCT "sale_date"::date) as "uniqueSaleDays"
          FROM "sales"
          GROUP BY "client_id"
        )
        SELECT 
          "clientId",
          "uniqueSaleDays"
        FROM "ClientFrequency"
        WHERE "uniqueSaleDays" = (SELECT MAX("uniqueSaleDays") FROM "ClientFrequency");
      `;

    if (!topClientsData || topClientsData.length === 0) {
      return [];
    }

    const clientIds = topClientsData.map((client) => client.clientId);

    const clients = await this.prisma.client.findMany({
      where: {
        id: { in: clientIds },
      },
      select: { id: true, name: true, email: true },
    });

    return clients.map((client) => {
      const frequencyData = topClientsData.find(
        (data) => data.clientId === client.id,
      );
      return {
        ...client,
        uniqueSaleDays: frequencyData
          ? Number(frequencyData.uniqueSaleDays)
          : 0,
      };
    });
  }
}
