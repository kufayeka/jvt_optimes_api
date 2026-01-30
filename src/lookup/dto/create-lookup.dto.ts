import { ApiProperty } from '@nestjs/swagger';

export class CreateLookupDto {
  @ApiProperty({ example: 'ACCOUNT_LIFECYCLE', maxLength: 100 })
  lookup_type: string;

  @ApiProperty({ example: 'CREATED', maxLength: 50 })
  code: string;

  @ApiProperty({ example: 'Created', maxLength: 100 })
  label: string;

  @ApiProperty({ example: 'Initial account state', required: false })
  description?: string;

  @ApiProperty({ example: 1, required: false })
  sort_order?: number;

  @ApiProperty({ example: true, required: false })
  is_active?: boolean;

  @ApiProperty({ example: { meta: 'value' }, required: false })
  attribute?: any;
}
