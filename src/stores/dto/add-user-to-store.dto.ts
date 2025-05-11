import { IsEmail, IsEnum, IsOptional, IsUUID } from 'class-validator';
import { StoreRole } from '../entities/store-user.entity';

export class AddUserToStoreDto {
  @IsOptional()
  @IsUUID()
  userId?: string;

  @IsOptional()
  @IsEmail()
  email?: string;

  @IsEnum(StoreRole)
  role: StoreRole;
}
