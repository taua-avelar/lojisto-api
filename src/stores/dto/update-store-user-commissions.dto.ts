import { IsBoolean } from 'class-validator';

export class UpdateStoreUserCommissionsDto {
  @IsBoolean()
  receiveCommissions: boolean;
}
