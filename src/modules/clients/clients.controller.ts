import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  ParseUUIDPipe,
  HttpCode,
  HttpStatus,
  UseGuards,
  Query,
} from '@nestjs/common';
import { ClientsService } from './clients.service';
import { CreateClientDto } from './dto/create-client.dto';
import { UpdateClientDto } from './dto/update-client.dto';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { FindClientsQueryDto } from './dto/find-clients-query.dto';

@ApiTags('Clients')
@Controller('clients')
export class ClientsController {
  constructor(private readonly clientsService: ClientsService) {}

  @Post()
  @ApiOperation({ summary: 'Criar um novo cliente' })
  @ApiResponse({ status: 201, description: 'Cliente criado com sucesso.' })
  @ApiResponse({ status: 400, description: 'Dados inválidos.' })
  create(@Body() createClientDto: CreateClientDto) {
    return this.clientsService.create(createClientDto);
  }

  @Get('report')
  @ApiOperation({
    summary: 'Gera um relatório customizado de clientes',
    description:
      'Retorna uma lista de clientes e suas vendas em uma estrutura aninhada, com suporte para filtros e paginação.',
  })
  @ApiResponse({
    status: 200,
    description: 'Relatório gerado com sucesso.',
  })
  getCustomReport(@Query() query: FindClientsQueryDto) {
    return this.clientsService.getCustomReport(query);
  }

  @Get('stats/top-total-sales')
  @ApiOperation({ summary: 'Cliente com o maior volume total de vendas' })
  getTopClientByTotalSales() {
    return this.clientsService.getTopClientByTotalSales();
  }

  @Get('stats/top-average-sale')
  @ApiOperation({ summary: 'Cliente com a maior média de valor por venda' })
  getTopClientByAverageSaleValue() {
    return this.clientsService.getTopClientByAverageSaleValue();
  }

  @Get('stats/top-purchase-frequency')
  @ApiOperation({
    summary: 'Cliente com o maior número de dias únicos com vendas registradas',
  })
  getTopClientByPurchaseFrequency() {
    return this.clientsService.getTopClientByPurchaseFrequency();
  }

  @Get()
  @ApiOperation({
    summary: 'Listar todos os clientes com filtros opcionais e paginação',
  })
  async findAll(@Query() query: FindClientsQueryDto) {
    return this.clientsService.findAll(query);
  }

  @Get(':id')
  @ApiBearerAuth('access-token')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Buscar um cliente por ID (UUID)' })
  @ApiResponse({ status: 200, description: 'Cliente encontrado.' })
  @ApiResponse({ status: 404, description: 'Cliente não encontrado.' })
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.clientsService.findOne(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Atualizar um cliente por ID (UUID)' })
  @ApiResponse({ status: 200, description: 'Cliente atualizado com sucesso.' })
  @ApiResponse({ status: 404, description: 'Cliente não encontrado.' })
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateClientDto: UpdateClientDto,
  ) {
    return this.clientsService.update(id, updateClientDto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Remover um cliente por ID (UUID)' })
  @ApiResponse({ status: 204, description: 'Cliente removido com sucesso.' })
  @ApiResponse({ status: 404, description: 'Cliente não encontrado.' })
  remove(@Param('id', ParseUUIDPipe) id: string) {
    return this.clientsService.remove(id);
  }
}
