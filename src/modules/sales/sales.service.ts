import {
  Injectable,
  NotFoundException,
  UnprocessableEntityException,
} from '@nestjs/common';
import { CreateSaleDto } from './dto/create-sale.dto';
import { UpdateSaleDto } from './dto/update-sale.dto';
import { PrismaService } from 'src/core/database/prisma.service';
import { SalesStatsQueryDto } from './dto/sales-stats-query.dto';
import { Prisma } from '@prisma/client';

@Injectable()
export class SalesService {
  constructor(private prisma: PrismaService) {}

  async create(createSaleDto: CreateSaleDto) {
    if (typeof createSaleDto.value !== 'number' || isNaN(createSaleDto.value)) {
      throw new UnprocessableEntityException(
        'O valor da venda deve ser um número.',
      );
    }
    if (createSaleDto.value <= 0) {
      throw new UnprocessableEntityException(
        'O valor da venda deve ser positivo.',
      );
    }
    if (!/^\d+(\.\d{1,2})?$/.test(String(createSaleDto.value))) {
      throw new UnprocessableEntityException(
        'O valor da venda deve ter no máximo 2 casas decimais.',
      );
    }
    const clientExists = await this.prisma.client.findUnique({
      where: { id: createSaleDto.clientId },
    });

    if (!clientExists) {
      throw new UnprocessableEntityException(
        `O cliente com ID "${createSaleDto.clientId}" não existe.`,
      );
    }

    return this.prisma.sale.create({
      data: {
        ...createSaleDto,
        saleDate: createSaleDto.saleDate
          ? new Date(createSaleDto.saleDate)
          : new Date(),
      },
    });
  }

  findAll() {
    return this.prisma.sale.findMany({
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
  }

  async findOne(id: number) {
    const sale = await this.prisma.sale.findUnique({
      where: { id },
      include: { client: true },
    });

    if (!sale) {
      throw new NotFoundException(`Venda com ID #${id} não encontrada.`);
    }
    return sale;
  }

  async update(id: number, updateSaleDto: UpdateSaleDto) {
    if (updateSaleDto.value !== undefined) {
      if (
        typeof updateSaleDto.value !== 'number' ||
        isNaN(updateSaleDto.value)
      ) {
        throw new UnprocessableEntityException(
          'O valor da venda deve ser um número.',
        );
      }
      if (updateSaleDto.value <= 0) {
        throw new UnprocessableEntityException(
          'O valor da venda deve ser positivo.',
        );
      }
      if (!/^\d+(\.\d{1,2})?$/.test(String(updateSaleDto.value))) {
        throw new UnprocessableEntityException(
          'O valor da venda deve ter no máximo 2 casas decimais.',
        );
      }
    }
    await this.findOne(id);

    if (updateSaleDto.clientId) {
      const clientExists = await this.prisma.client.findUnique({
        where: { id: updateSaleDto.clientId },
      });
      if (!clientExists) {
        throw new UnprocessableEntityException(
          `O cliente com ID "${updateSaleDto.clientId}" não existe.`,
        );
      }
    }

    return this.prisma.sale.update({
      where: { id },
      data: {
        ...updateSaleDto,
        saleDate: updateSaleDto.saleDate
          ? new Date(updateSaleDto.saleDate)
          : undefined,
      },
    });
  }

  async remove(id: number) {
    await this.findOne(id);
    return this.prisma.sale.delete({ where: { id } });
  }

  async getSalesPerDay(filters: SalesStatsQueryDto) {
    const where: Prisma.SaleWhereInput = {};

    const dateFilter: Prisma.DateTimeFilter = {};

    if (filters.lastMonths) {
      const startDate = new Date();
      startDate.setMonth(startDate.getMonth() - filters.lastMonths);
      startDate.setHours(0, 0, 0, 0);
      dateFilter.gte = startDate;
    }

    if (filters.startDate) {
      dateFilter.gte = new Date(filters.startDate);
    }

    if (filters.endDate) {
      const endDate = new Date(filters.endDate);
      endDate.setDate(endDate.getDate() + 1);
      dateFilter.lt = endDate;
    }

    if (Object.keys(dateFilter).length > 0) {
      where.saleDate = dateFilter;
    }

    if (filters.year && !where.saleDate) {
      const year = filters.year;
      let gte = new Date(`${year}-01-01T00:00:00.000Z`);
      let lt = new Date(`${year + 1}-01-01T00:00:00.000Z`);

      if (filters.month) {
        const month = filters.month;
        gte = new Date(
          `${year}-${String(month).padStart(2, '0')}-01T00:00:00.000Z`,
        );
        const nextMonth = month === 12 ? 1 : month + 1;
        const nextYear = month === 12 ? year + 1 : year;
        lt = new Date(
          `${nextYear}-${String(nextMonth).padStart(2, '0')}-01T00:00:00.000Z`,
        );
      }
      where.saleDate = { gte, lt };
    }

    const conditions: Prisma.Sql[] = [];
    if (where.saleDate) {
      const finalDateFilter = where.saleDate as Prisma.DateTimeFilter;
      if (finalDateFilter.gte)
        conditions.push(Prisma.sql`"sale_date" >= ${finalDateFilter.gte}`);
      if (finalDateFilter.lt)
        conditions.push(Prisma.sql`"sale_date" < ${finalDateFilter.lt}`);
    }

    const whereClause =
      conditions.length > 0
        ? Prisma.sql`WHERE ${Prisma.join(conditions, ' AND ')}`
        : Prisma.empty;

    const query = Prisma.sql`
      SELECT DATE_TRUNC('day', "sale_date") as date, COUNT(id)::int as total
      FROM "sales"
      ${whereClause}
      GROUP BY DATE_TRUNC('day', "sale_date")
      ORDER BY date ASC
    `;

    const result: { date: Date; total: number }[] =
      await this.prisma.$queryRaw(query);

    return result.map((item) => ({
      date: item.date.toISOString().split('T')[0],
      total: item.total,
    }));
  }
}
