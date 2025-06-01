import { Injectable, UnauthorizedException, BadRequestException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { UsersService } from '../users/users.service';
import { LoginDto } from './dto/login.dto';
import { ChangePasswordDto } from './dto/change-password.dto';

@Injectable()
export class AuthService {
  constructor(
    private usersService: UsersService,
    private jwtService: JwtService,
  ) {}

  async login(loginDto: LoginDto) {
    console.log(`Tentativa de login para o email: ${loginDto.email}`);
    const user = await this.usersService.validateUser(loginDto.email, loginDto.password);
    if (!user) {
      console.log('Login falhou: credenciais inválidas');
      throw new UnauthorizedException('Credenciais inválidas');
    }

    console.log(`Login bem-sucedido para o usuário: ${user.email}`);
    const payload = {
      sub: user.id,
      email: user.email,
      name: user.name,
    };

    const token = this.jwtService.sign(payload);
    console.log(`Token gerado para o usuário: ${user.email.substring(0, 3)}...`);

    return {
      access_token: token,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
      }
    };
  }

  async getProfile(userId: string) {
    console.log(`Buscando perfil do usuário ID: ${userId}`);
    const user = await this.usersService.findOne(userId, false); // Não incluir senha
    if (!user) {
      console.log(`Usuário com ID ${userId} não encontrado`);
      throw new UnauthorizedException('Usuário não encontrado');
    }

    console.log(`Perfil encontrado para o usuário: ${user.email}`);
    return {
      id: user.id,
      email: user.email,
      name: user.name,
    };
  }

  async changePassword(userId: string, changePasswordDto: ChangePasswordDto) {
    console.log(`Solicitação de alteração de senha para o usuário ID: ${userId}`);
    console.log(`Dados recebidos: ${JSON.stringify({
      userId,
      current_password_length: changePasswordDto.current_password?.length || 0,
      new_password_length: changePasswordDto.new_password?.length || 0
    })}`);

    if (!userId) {
      console.error('ID do usuário não fornecido');
      throw new UnauthorizedException('Usuário não identificado');
    }

    if (!changePasswordDto.current_password || !changePasswordDto.new_password) {
      console.error('Dados de senha incompletos');
      throw new BadRequestException('Dados de senha incompletos');
    }

    console.log(`Senha atual fornecida: ${changePasswordDto.current_password.substring(0, 1)}${'*'.repeat(changePasswordDto.current_password.length - 1)}`);
    console.log(`Nova senha fornecida: ${changePasswordDto.new_password.substring(0, 1)}${'*'.repeat(changePasswordDto.new_password.length - 1)}`);

    try {
      await this.usersService.changePassword(
        userId,
        changePasswordDto.current_password,
        changePasswordDto.new_password
      );

      console.log('Senha alterada com sucesso');
      return {
        message: 'Senha alterada com sucesso'
      };
    } catch (error) {
      console.error('Erro ao alterar senha:', error.message);
      console.error('Stack trace:', error.stack);
      throw error;
    }
  }
}
