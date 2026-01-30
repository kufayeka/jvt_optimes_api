import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { LookupResponseDto } from '../../lookup/dto/lookup-response.dto';

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

  @ApiProperty({ type: () => LookupResponseDto, description: 'Populated lookup object for account_lifecycle' })
  account_lifecycle: LookupResponseDto | null;

  @ApiProperty({ type: () => LookupResponseDto, description: 'Populated lookup object for account_type' })
  account_type: LookupResponseDto | null;

  @ApiPropertyOptional({ type: () => LookupResponseDto, description: 'Populated lookup object for account_role' })
  account_role?: LookupResponseDto | null;

  @ApiPropertyOptional({ example: '2026-12-31T00:00:00.000Z' })
  account_expiry_date?: string | null;

  @ApiPropertyOptional({ example: '2026-01-01T00:00:00.000Z' })
  password_last_changed?: string | null;

  @ApiPropertyOptional({ example: '2026-01-01T00:00:00.000Z' })
  password_expiry_time?: string | null;

  @ApiProperty({ example: true })
  must_change_password: boolean;

  @ApiPropertyOptional({ example: '2026-01-01T00:00:00.000Z' })
  last_login_time?: string | null;

  
}
