import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class AccountResponseDto {
  @ApiProperty({ example: '3fa85f64-5717-4562-b3fc-2c963f66afa6' })
  id: string;

  @ApiProperty({ example: 'alice1' })
  username: string;

  @ApiProperty({ example: 'Alice Example' })
  full_name: string;

  @ApiPropertyOptional({ example: '+628123456789' })
  phone_number?: string;

  @ApiPropertyOptional({ example: 'alice@example.com' })
  email?: string;

  @ApiPropertyOptional({ example: { meta: 'value' } })
  attribute?: any;

  @ApiProperty({ description: 'Lookup id for account_lifecycle (uuid)' })
  account_lifecycle: string;

  @ApiProperty({ description: 'Lookup id for account_type (uuid)' })
  account_type: string;

  @ApiPropertyOptional({ description: 'Lookup id for account_role (uuid)' })
  account_role?: string | null;

  @ApiPropertyOptional({ example: '2026-12-31T00:00:00.000Z' })
  account_expiry_date?: string | null;

  @ApiPropertyOptional({ example: '2026-01-01T00:00:00.000Z' })
  password_last_changed?: string | null;

  @ApiProperty({ example: true })
  must_change_password: boolean;

  @ApiPropertyOptional({ example: '2026-01-01T00:00:00.000Z' })
  last_login_time?: string | null;
}
