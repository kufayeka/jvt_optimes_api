import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Expose } from 'class-transformer';

export class JobOffsetPrinterTaiyoImportErrorDto {
  @Expose()
  @ApiProperty({ example: 3 })
  row: number;

  @Expose()
  @ApiProperty({ example: 'work_order' })
  field: string;

  @Expose()
  @ApiProperty({ example: 'Work order already exists' })
  message: string;

  @Expose()
  @ApiPropertyOptional({ example: 'WO-2026-0001' })
  value?: any;
}
