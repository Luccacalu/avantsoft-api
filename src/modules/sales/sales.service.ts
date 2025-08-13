import {
  Injectable,
  NotFoundException,
  UnprocessableEntityException,
} from '@nestjs/common';
import { CreateSaleDto } from './dto/create-sale.dto';
import { UpdateSaleDto } from './dto/update-sale.dto';
import { PrismaService } from 'src/core/database/prisma.service';

@Injectable()
export class SalesService {
  constructor(private prisma: PrismaService) {}

  async create(createSaleDto: CreateSaleDto) {
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
}
