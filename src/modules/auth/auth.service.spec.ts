import { Test, TestingModule } from '@nestjs/testing';
import { AuthService } from './auth.service';
import { PrismaService } from 'src/core/database/prisma.service';
import { JwtService } from '@nestjs/jwt';
import { ConflictException, UnauthorizedException } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
jest.mock('bcrypt', () => ({
  hash: jest.fn(),
  compare: jest.fn(),
}));

describe('AuthService', () => {
  let service: AuthService;

  const mockPrisma = {
    user: {
      findUnique: jest.fn(),
      create: jest.fn(),
    },
  };
  const mockJwt = {
    sign: jest.fn(),
  };

  beforeEach(async () => {
    jest.clearAllMocks();
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: PrismaService, useValue: mockPrisma },
        { provide: JwtService, useValue: mockJwt },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
  });

  describe('register', () => {
    it('should register a new user', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(null);
      mockPrisma.user.create.mockResolvedValue({
        id: 'user-uuid',
        email: 'test@email.com',
        name: 'Test',
        password: 'hashed',
      });
      (bcrypt.hash as jest.Mock).mockResolvedValue('hashed');
      const result = await service.register(
        'test@email.com',
        'Test',
        '12345678',
      );
      expect(result).toEqual({
        message: 'Usuário criado com sucesso',
        userId: 'user-uuid',
      });
      expect(mockPrisma.user.findUnique).toHaveBeenCalledWith({
        where: { email: 'test@email.com' },
      });
      expect(mockPrisma.user.create).toHaveBeenCalled();
    });

    it('should throw ConflictException if email already exists', async () => {
      mockPrisma.user.findUnique.mockResolvedValue({
        id: 'user-uuid',
        email: 'test@email.com',
      });
      await expect(
        service.register('test@email.com', 'Test', '12345678'),
      ).rejects.toThrow(ConflictException);
    });
  });

  describe('login', () => {
    it('should login and return access_token', async () => {
      mockPrisma.user.findUnique.mockResolvedValue({
        id: 'user-uuid',
        email: 'test@email.com',
        password: 'hashed',
      });
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);
      mockJwt.sign.mockReturnValue('token');
      const result = await service.login('test@email.com', '12345678');
      expect(result).toEqual({ access_token: 'token' });
      expect(mockPrisma.user.findUnique).toHaveBeenCalledWith({
        where: { email: 'test@email.com' },
      });
      expect(mockJwt.sign).toHaveBeenCalledWith({
        sub: 'user-uuid',
        email: 'test@email.com',
      });
    });

    it('should throw UnauthorizedException if user not found', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(null);
      await expect(
        service.login('notfound@email.com', '12345678'),
      ).rejects.toThrow(UnauthorizedException);
    });

    it('should throw UnauthorizedException if password is invalid', async () => {
      mockPrisma.user.findUnique.mockResolvedValue({
        id: 'user-uuid',
        email: 'test@email.com',
        password: 'hashed',
      });
      (bcrypt.compare as jest.Mock).mockResolvedValue(false);
      await expect(
        service.login('test@email.com', 'wrongpass'),
      ).rejects.toThrow(UnauthorizedException);
    });
  });
});
