import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Expose } from 'class-transformer';

export class LookupResponseDto {
  @Expose()
  @ApiProperty({ example: 1 })
  id: number;

  @Expose()
  @ApiProperty({ example: 'ACCOUNT_LIFECYCLE' })
  lookup_type: string;

  @Expose()
  @ApiProperty({ example: 'CREATED' })
  code: string;

  @Expose()
  @ApiProperty({ example: 'Created' })
  label: string;

  @Expose()
  @ApiPropertyOptional({ example: 'Initial account state' })
  description?: string | null;

  @Expose()
  @ApiPropertyOptional({ example: 1 })
  sort_order?: number | null;

  @Expose()
  @ApiProperty({ example: true })
  is_active: boolean;

  @Expose()
  @ApiPropertyOptional({ example: { metadata: 'value' } })
  attribute?: any | null;
}
