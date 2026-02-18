import { ApiPropertyOptional } from '@nestjs/swagger';

export class EditAccountDto {
  @ApiPropertyOptional({
    example: 'alice1',
    description: 'Username rules: unique, lowercase, alphanumeric + underscore, length 4–20, regex ^[a-z][a-z0-9_]{3,19}$',
  })
  username?: string;

  @ApiPropertyOptional({ example: 'Alice Example' })
  full_name?: string;

  @ApiPropertyOptional({ example: '+628123456789', nullable: true })
  phone_number?: string | null;

  @ApiPropertyOptional({ example: 'alice@example.com', nullable: true })
  email?: string | null;

  @ApiPropertyOptional({ example: { meta: 'value' }, nullable: true })
  attribute?: any | null;
}
