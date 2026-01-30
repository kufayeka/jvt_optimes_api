import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class LookupResponseDto {
  @ApiProperty({ example: 1 })
  id: number;

  @ApiProperty({ example: 'ACCOUNT_LIFECYCLE' })
  lookup_type: string;

  @ApiProperty({ example: 'CREATED' })
  code: string;

  @ApiProperty({ example: 'Created' })
  label: string;

  @ApiPropertyOptional({ example: 'Initial account state' })
  description?: string | null;

  @ApiPropertyOptional({ example: 1 })
  sort_order?: number | null;

  @ApiProperty({ example: true })
  is_active: boolean;

  @ApiPropertyOptional({ example: { metadata: 'value' } })
  attribute?: any | null;
}
