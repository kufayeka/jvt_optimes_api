import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateJobOffsetPrinterTaiyoDto {
  @ApiProperty({ example: 'WO-2026-0001', description: 'Must be unique' })
  work_order: string;

  @ApiProperty({ example: 'SO-2026-0188' })
  sales_order: string;

  @ApiPropertyOptional({ example: 1, default: 1 })
  quantity_order?: number;

  @ApiProperty({ example: 21, description: 'Lookup id for QUANTITY_UNIT (BK, EA)' })
  quantity_unit: number;

  @ApiProperty({ example: 31, description: 'Lookup id for WORK_CENTER (MACHINE_A, MACHINE_B)' })
  work_center: number;

  @ApiProperty({ example: '2026-02-20T08:00:00.000Z' })
  planned_start_time: string;

  @ApiPropertyOptional({ example: '2026-02-20T08:10:00.000Z' })
  release_date?: string | null;

  @ApiPropertyOptional({ example: '2026-02-21T16:00:00.000Z' })
  due_date?: string | null;

  @ApiProperty({ example: 11, description: 'Lookup id for JOB_PRIORITY (HIGH, MEDIUM, LOW)' })
  job_priority: number;

  @ApiPropertyOptional({ example: 'Print urgent order', default: '-' })
  notes?: string;

  @ApiPropertyOptional({ example: { customer: 'ABC', color: 'CMYK' } })
  attribute?: any;
}
