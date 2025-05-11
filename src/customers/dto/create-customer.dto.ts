import { IsString, IsEmail, IsOptional, IsBoolean, ValidateIf } from 'class-validator';

export class CreateCustomerDto {
  @IsString()
  name: string;

  @IsOptional()
  @IsEmail(undefined, { message: 'Email inválido' })
  @ValidateIf((o) => o.email !== '' && o.email !== null && o.email !== undefined)
  email?: string;

  @IsString()
  @IsOptional()
  phone?: string;

  @IsString()
  @IsOptional()
  address?: string;

  @IsString()
  @IsOptional()
  document?: string;

  @IsBoolean()
  @IsOptional()
  isActive?: boolean;
}
