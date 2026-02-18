import { ApiPropertyOptional } from '@nestjs/swagger';

export class UpdateJobOffsetPrinterTaiyoDto {
  @ApiPropertyOptional({ example: 'WO-2026-0002' })
  work_order?: string;

  @ApiPropertyOptional({ example: 'SO-2026-0189' })
  sales_order?: string;

  @ApiPropertyOptional({ example: 2 })
  quantity_order?: number;

  @ApiPropertyOptional({ example: 22, description: 'Lookup id for QUANTITY_UNIT (BK, EA)' })
  quantity_unit?: number;

  @ApiPropertyOptional({ example: 32, description: 'Lookup id for WORK_CENTER (MACHINE_A, MACHINE_B)' })
  work_center?: number;

  @ApiPropertyOptional({ example: '2026-02-20T10:00:00.000Z' })
  planned_start_time?: string;

  @ApiPropertyOptional({ example: '2026-02-20T10:10:00.000Z' })
  release_date?: string | null;

  @ApiPropertyOptional({ example: '2026-02-22T16:00:00.000Z' })
  due_date?: string | null;

  @ApiPropertyOptional({ example: 12, description: 'Lookup id for JOB_PRIORITY (HIGH, MEDIUM, LOW)' })
  job_priority?: number;

  @ApiPropertyOptional({ example: 'Rescheduled by PPIC' })
  notes?: string;

  @ApiPropertyOptional({ example: { customer: 'XYZ' } })
  attribute?: any;
}
