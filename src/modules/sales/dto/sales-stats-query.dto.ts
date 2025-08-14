import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsInt, Min, IsDateString, IsOptional } from 'class-validator';

export class SalesStatsQueryDto {
  @ApiPropertyOptional({
    example: 2025,
    description:
      "Ano específico para filtrar. Ignorado se filtros de intervalo ('startDate', 'endDate', 'lastMonths') forem usados.",
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  year?: number;

  @ApiPropertyOptional({
    example: 8,
    description:
      "Mês específico (1-12). Requer 'year' e será ignorado se filtros de intervalo forem usados.",
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  month?: number;

  @ApiPropertyOptional({
    example: 6,
    description:
      "Filtra pelos últimos X meses. Ignorado se 'startDate' for fornecido.",
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  lastMonths?: number;

  @ApiPropertyOptional({
    example: '2025-01-01',
    description:
      "Data inicial do intervalo (YYYY-MM-DD). Tem prioridade sobre 'lastMonths'.",
  })
  @IsOptional()
  @IsDateString()
  startDate?: string;

  @ApiPropertyOptional({
    example: '2025-08-13',
    description: 'Data final do intervalo (YYYY-MM-DD).',
  })
  @IsOptional()
  @IsDateString()
  endDate?: string;
}
