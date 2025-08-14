import { Test, TestingModule } from '@nestjs/testing';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';

describe('AuthController', () => {
  let controller: AuthController;

  const mockAuthService = {
    register: jest.fn(),
    login: jest.fn(),
  };

  beforeEach(async () => {
    jest.clearAllMocks();
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [{ provide: AuthService, useValue: mockAuthService }],
    }).compile();

    controller = module.get<AuthController>(AuthController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('register', () => {
    it('should call authService.register and return result', async () => {
      const dto = {
        email: 'test@email.com',
        name: 'Test',
        password: '12345678',
      };
      mockAuthService.register.mockResolvedValue({
        message: 'Usuário criado com sucesso',
        userId: 'user-uuid',
      });
      const result = await controller.register(dto);
      expect(mockAuthService.register).toHaveBeenCalledWith(
        dto.email,
        dto.name,
        dto.password,
      );
      expect(result).toEqual({
        message: 'Usuário criado com sucesso',
        userId: 'user-uuid',
      });
    });

    it('should propagate errors from authService.register', async () => {
      const dto = {
        email: 'test@email.com',
        name: 'Test',
        password: '12345678',
      };
      mockAuthService.register.mockRejectedValue(new Error('fail'));
      await expect(controller.register(dto)).rejects.toThrow('fail');
    });
  });

  describe('login', () => {
    it('should call authService.login and return result', async () => {
      const dto = { email: 'test@email.com', password: '12345678' };
      mockAuthService.login.mockResolvedValue({ access_token: 'token' });
      const result = await controller.login(dto);
      expect(mockAuthService.login).toHaveBeenCalledWith(
        dto.email,
        dto.password,
      );
      expect(result).toEqual({ access_token: 'token' });
    });

    it('should propagate errors from authService.login', async () => {
      const dto = { email: 'test@email.com', password: '12345678' };
      mockAuthService.login.mockRejectedValue(new Error('fail'));
      await expect(controller.login(dto)).rejects.toThrow('fail');
    });
  });
});
