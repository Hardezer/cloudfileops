import {
  ConflictException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { UserRole } from '@prisma/client';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../../database/prisma.service';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';

@Injectable()
export class AuthService {
  constructor(
    private readonly prismaService: PrismaService,
    private readonly jwtService: JwtService,
  ) {}

  async register(registerDto: RegisterDto) {
    const existingUser = await this.prismaService.user.findUnique({
      where: {
        email: registerDto.email,
      },
    });

    if (existingUser) {
      throw new ConflictException('Email already registered');
    }

    const passwordHash = await bcrypt.hash(registerDto.password, 10);

    const result = await this.prismaService.$transaction(async (tx) => {
      const company = await tx.company.create({
        data: {
          name: registerDto.companyName,
        },
      });

      const user = await tx.user.create({
        data: {
          email: registerDto.email,
          passwordHash: passwordHash,
          role: UserRole.ADMIN,
          companyId: company.id,
        },
        select: {
          id: true,
          email: true,
          role: true,
          companyId: true,
          createdAt: true,
        },
      });

      return {
        company,
        user,
      };
    });

    const accessToken = await this.generateToken(result.user);

    return {
      accessToken: accessToken,
      user: result.user,
      company: {
        id: result.company.id,
        name: result.company.name,
      },
    };
  }

  async login(loginDto: LoginDto) {
    const user = await this.prismaService.user.findUnique({
      where: {
        email: loginDto.email,
      },
    });

    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const passwordIsValid = await bcrypt.compare(
      loginDto.password,
      user.passwordHash,
    );

    if (!passwordIsValid) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const safeUser = {
      id: user.id,
      email: user.email,
      role: user.role,
      companyId: user.companyId,
      createdAt: user.createdAt,
    };

    const accessToken = await this.generateToken(safeUser);

    return {
      accessToken: accessToken,
      user: safeUser,
    };
  }

  private async generateToken(user: {
    id: string;
    email: string;
    role: string;
    companyId: string;
  }) {
    const payload = {
      sub: user.id,
      email: user.email,
      role: user.role,
      companyId: user.companyId,
    };

    return this.jwtService.signAsync(payload);
  }
}
