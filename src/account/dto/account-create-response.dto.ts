import { ApiProperty } from '@nestjs/swagger';
import { Expose, Type } from 'class-transformer';
import { AccountResponseDto } from './account-response.dto';

export class AccountCreateResponseDto {
  @Expose()
  @Type(() => AccountResponseDto)
  @ApiProperty({ type: () => AccountResponseDto })
  account: AccountResponseDto;

  @Expose()
  @ApiProperty({ example: 'A$1b2C3d4E5f6G7' })
  initial_password: string;
}
