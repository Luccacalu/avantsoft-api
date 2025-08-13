import { IsEmail, IsNotEmpty, MinLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class RegisterDto {
  @ApiProperty({ example: 'tony.stark@email.com' })
  @IsEmail()
  email: string;

  @ApiProperty({ example: 'Tony Stark' })
  @IsNotEmpty()
  name: string;

  @ApiProperty({ example: '12345678' })
  @MinLength(6)
  password: string;
}
