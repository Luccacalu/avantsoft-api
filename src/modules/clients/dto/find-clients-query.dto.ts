import { IsOptional, IsString } from 'class-validator';
import { PaginationQueryDto } from './pagination-query.dto';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class FindClientsQueryDto extends PaginationQueryDto {
  @ApiPropertyOptional({
    example: 'Diana',
    description: 'Nome do cliente (filtro parcial)',
  })
  @IsOptional()
  @IsString()
  name?: string;

  @ApiPropertyOptional({
    example: 'diana@email.com',
    description: 'E-mail do cliente (filtro parcial)',
  })
  @IsOptional()
  @IsString()
  email?: string;
}
