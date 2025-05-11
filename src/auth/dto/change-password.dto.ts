import { IsNotEmpty, IsString, MinLength } from 'class-validator';

export class ChangePasswordDto {
  @IsNotEmpty({ message: 'A senha atual é obrigatória' })
  @IsString({ message: 'A senha atual deve ser uma string' })
  current_password: string;

  @IsNotEmpty({ message: 'A nova senha é obrigatória' })
  @IsString({ message: 'A nova senha deve ser uma string' })
  @MinLength(6, { message: 'A nova senha deve ter pelo menos 6 caracteres' })
  new_password: string;
}
