import { Injectable, ConflictException, NotFoundException, BadRequestException, UnauthorizedException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from './entities/user.entity';
import * as bcrypt from 'bcrypt';
import { CreateUserDto } from './dto/create-user.dto';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private usersRepository: Repository<User>,
  ) {}

  async validateUser(email: string, password: string): Promise<User | null> {
    console.log(`Validando usuário com email: ${email}`);
    const user = await this.usersRepository.findOne({
      where: { email },
      select: ['id', 'email', 'name', 'password'] // Garantir que a senha seja selecionada
    });

    if (!user) {
      console.log(`Usuário com email ${email} não encontrado`);
      return null;
    }

    console.log('Verificando senha...');
    console.log(`Hash da senha armazenada: ${user.password.substring(0, 10)}...`);
    const isPasswordValid = await bcrypt.compare(password, user.password);
    console.log(`Senha válida? ${isPasswordValid}`);

    if (isPasswordValid) {
      console.log('Autenticação bem-sucedida');
      return user;
    }

    console.log('Autenticação falhou: senha incorreta');
    return null;
  }

  async findOne(id: string, includePassword: boolean = false): Promise<User | null> {
    const options: any = { where: { id } };

    if (includePassword) {
      options.select = ['id', 'email', 'name', 'password'];
    }

    return this.usersRepository.findOne(options);
  }

  async findByEmail(email: string, includePassword: boolean = false): Promise<User | null> {
    const options: any = { where: { email } };

    if (includePassword) {
      options.select = ['id', 'email', 'name', 'password'];
    }

    return this.usersRepository.findOne(options);
  }

  async create(createUserDto: CreateUserDto): Promise<User> {
    // Verificar se o email já está em uso
    const existingUser = await this.findByEmail(createUserDto.email);
    if (existingUser) {
      throw new ConflictException(`Usuário com email ${createUserDto.email} já existe`);
    }

    // Gerar hash da senha
    const salt = await bcrypt.genSalt();
    const hashedPassword = await bcrypt.hash(createUserDto.password, salt);

    // Criar o usuário
    const user = this.usersRepository.create({
      email: createUserDto.email,
      password: hashedPassword,
      name: createUserDto.name || createUserDto.email.split('@')[0], // Usar parte do email como nome se não fornecido
    });

    return this.usersRepository.save(user);
  }

  generateRandomPassword(length: number = 8): string {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let password = '';
    for (let i = 0; i < length; i++) {
      password += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return password;
  }

  async createOrFind(email: string): Promise<{ user: User; isNewUser: boolean; temporaryPassword?: string }> {
    // Verificar se o usuário já existe
    const existingUser = await this.findByEmail(email);
    if (existingUser) {
      return { user: existingUser, isNewUser: false };
    }

    // Gerar senha aleatória para o novo usuário
    const temporaryPassword = this.generateRandomPassword();

    // Criar um novo usuário com senha temporária
    const createUserDto: CreateUserDto = {
      email,
      password: temporaryPassword,
      name: email.split('@')[0], // Usar parte do email como nome
    };

    const newUser = await this.create(createUserDto);

    return {
      user: newUser,
      isNewUser: true,
      temporaryPassword
    };
  }

  async changePassword(userId: string, currentPassword: string, newPassword: string): Promise<void> {
    console.log(`Iniciando alteração de senha para o usuário ID: ${userId}`);

    if (!userId) {
      console.error('UsersService - changePassword - ID do usuário não fornecido');
      throw new BadRequestException('ID do usuário é obrigatório');
    }

    if (!currentPassword || !newPassword) {
      console.error('UsersService - changePassword - Senhas não fornecidas');
      throw new BadRequestException('Senhas atual e nova são obrigatórias');
    }

    try {
      // Buscar o usuário pelo ID diretamente do banco de dados
      const user = await this.usersRepository.findOne({
        where: { id: userId },
        select: ['id', 'email', 'password'] // Garantir que a senha seja selecionada
      });

      if (!user) {
        console.log(`Usuário com ID ${userId} não encontrado`);
        throw new NotFoundException('Usuário não encontrado');
      }

      console.log(`Usuário encontrado: ${user.email}`);

      if (!user.password) {
        console.error(`UsersService - changePassword - Usuário ${userId} não tem senha armazenada`);
        throw new BadRequestException('Usuário não possui senha configurada');
      }

      console.log(`Hash da senha armazenada: ${user.password.substring(0, 10)}...`);

      // Verificar se a senha atual está correta
      console.log(`Verificando senha atual: ${currentPassword.substring(0, 1)}${'*'.repeat(currentPassword.length - 1)}`);
      const isPasswordValid = await bcrypt.compare(currentPassword, user.password);
      console.log(`Senha atual válida? ${isPasswordValid}`);

      if (!isPasswordValid) {
        console.log('Senha atual incorreta, autenticação falhou');
        throw new UnauthorizedException('Senha atual incorreta');
      }

      // Verificar se a nova senha é diferente da atual
      if (currentPassword === newPassword) {
        console.log('Nova senha é igual à senha atual');
        throw new BadRequestException('A nova senha deve ser diferente da senha atual');
      }

      console.log('Gerando hash para a nova senha...');
      // Gerar hash da nova senha
      const salt = await bcrypt.genSalt();
      const hashedPassword = await bcrypt.hash(newPassword, salt);
      console.log(`Novo hash gerado: ${hashedPassword.substring(0, 10)}...`);

      // Atualizar a senha do usuário
      console.log('Atualizando senha no banco de dados...');
      user.password = hashedPassword;
      await this.usersRepository.save(user);
      console.log('Senha atualizada com sucesso');
    } catch (error) {
      console.error('Erro durante a alteração de senha:', error.message);
      console.error('Stack trace:', error.stack);

      // Repassar o erro original se for um dos nossos erros conhecidos
      if (error instanceof NotFoundException ||
          error instanceof UnauthorizedException ||
          error instanceof BadRequestException) {
        throw error;
      }

      // Para outros erros, lançar um erro genérico
      throw new BadRequestException('Erro ao alterar senha: ' + error.message);
    }
  }
}
