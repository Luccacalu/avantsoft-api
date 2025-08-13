import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { CreateClientDto } from './dto/create-client.dto';
import { UpdateClientDto } from './dto/update-client.dto';
import { Prisma } from '@prisma/client';
import { PrismaService } from 'src/core/database/prisma.service';

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

  findAll() {
    return this.prisma.client.findMany({ include: { sales: true } });
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
}
