import { Controller, Post, Body } from '@nestjs/common';
import { ApiTags, ApiBody } from '@nestjs/swagger';
import { AuthService } from './auth.service';

@ApiTags('Auth')
@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @Post('register')
  @ApiBody({
    schema: {
      example: {
        email: 'tony.stark@email.com',
        name: 'Tony Stark',
        password: '12345678',
      },
    },
  })
  register(@Body() body: { email: string; name: string; password: string }) {
    return this.authService.register(body.email, body.name, body.password);
  }

  @Post('login')
  @ApiBody({
    schema: {
      example: { email: 'tony.stark@email.com', password: '12345678' },
    },
  })
  login(@Body() body: { email: string; password: string }) {
    return this.authService.login(body.email, body.password);
  }
}
