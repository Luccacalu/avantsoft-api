import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsDateString,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsPositive,
  IsUUID,
} from 'class-validator';

export class CreateSaleDto {
  @ApiProperty({
    description:
      'O valor da venda. Deve ser um número positivo com no máximo 2 casas decimais.',
    example: 199.99,
  })
  @IsNumber(
    { maxDecimalPlaces: 2 },
    { message: 'O valor da venda deve ter no máximo 2 casas decimais.' },
  )
  @IsPositive()
  @Type(() => Number)
  value: number;

  @ApiProperty({
    description: 'O ID (UUID) do cliente que realizou a compra.',
    example: 'a1b2c3d4-e5f6-7890-1234-567890abcdef',
  })
  @IsUUID()
  @IsNotEmpty()
  clientId: string;

  @ApiProperty({
    description:
      '(Opcional) A data da venda no formato ISO 8601. Se não for fornecida, usa a data atual.',
    example: '2025-08-13T10:00:00Z',
    required: false,
  })
  @IsOptional()
  @IsDateString()
  saleDate?: string;
}
