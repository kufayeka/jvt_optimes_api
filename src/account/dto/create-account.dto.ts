import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateAccountDto {
  @ApiProperty({
    example: 'alice1',
    description: "Username rules: unique, lowercase, alphanumeric + underscore, length 4–20, regex ^[a-z][a-z0-9_]{3,19}$",
  })
  username: string;

  @ApiProperty({ example: 'Alice Example' })
  full_name: string;

  @ApiPropertyOptional({ example: '+628123456789' })
  phone_number?: string;

  @ApiPropertyOptional({ example: 'alice@example.com' })
  email?: string;

  @ApiPropertyOptional({ example: { meta: 'value' } })
  attribute?: any;

  @ApiProperty({ description: 'Lookup id for account_type (uuid). If WITH_EXPIRATION, account_expiry_date is required.' })
  account_type: string;

  @ApiPropertyOptional({ description: 'Lookup id for account_role (uuid)' })
  account_role?: string;

  @ApiPropertyOptional({ description: 'Required if account_type is WITH_EXPIRATION. Must be null for PERMANENT.', example: '2026-12-31T00:00:00.000Z' })
  account_expiry_date?: string;
}
