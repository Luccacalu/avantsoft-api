import { ApiProperty } from '@nestjs/swagger';
import { IsDateString, IsEmail, IsNotEmpty, IsString } from 'class-validator';

export class CreateClientDto {
  @ApiProperty({
    description: 'O nome completo do cliente.',
    example: 'Bruce Wayne',
  })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({
    description: 'O endereço de e-mail único do cliente.',
    example: 'wayne.enterprises@email.com',
  })
  @IsEmail()
  email: string;

  @ApiProperty({
    description: 'A data de nascimento do cliente no formato ISO 8601.',
    example: '1815-12-10T00:00:00Z',
  })
  @IsDateString()
  birthDate: string;
}
