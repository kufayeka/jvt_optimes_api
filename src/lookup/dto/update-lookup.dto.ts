import { ApiPropertyOptional } from '@nestjs/swagger';

export class UpdateLookupDto {
  @ApiPropertyOptional({ example: 'ACCOUNT_LIFECYCLE', maxLength: 100 })
  lookup_type?: string;

  @ApiPropertyOptional({ example: 'CREATED', maxLength: 50 })
  code?: string;

  @ApiPropertyOptional({ example: 'Created', maxLength: 100 })
  label?: string;

  @ApiPropertyOptional({ example: 'Initial account state' })
  description?: string;

  @ApiPropertyOptional({ example: 1 })
  sort_order?: number;

  @ApiPropertyOptional({ example: true })
  is_active?: boolean;

  @ApiPropertyOptional({ example: { meta: 'value' } })
  attribute?: any;
}
