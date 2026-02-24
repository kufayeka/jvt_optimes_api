import { ApiProperty } from '@nestjs/swagger';
import { Expose } from 'class-transformer';
import { JobOffsetPrinterTaiyoImportErrorDto } from './job-offset-printer-taiyo-import-error.dto';

class JobOffsetPrinterTaiyoUploadPreviewDataDto {
  @Expose()
  @ApiProperty({
    type: 'array',
    items: { type: 'object' },
    description: 'Valid rows in unpopulated format (lookup fields as IDs) for batch-create payload',
    example: [
      {
        __row: 2,
        work_order: 'WO-2026-0001',
        sales_order: 'SO-2026-0188',
        quantity_order: 1,
        quantity_unit: 21,
        work_center: 31,
        planned_start_time: '2026-02-20T08:00:00.000Z',
        release_date: null,
        due_date: '2026-02-21T16:00:00.000Z',
        job_priority: 11,
        notes: '-',
        attribute: null,
      },
    ],
  })
  unpopulated: any[];

  @Expose()
  @ApiProperty({
    type: 'array',
    items: { type: 'object' },
    description: 'Valid rows in populated format (lookup fields as full lookup objects) for review/view context',
    example: [
      {
        __row: 2,
        work_order: 'WO-2026-0001',
        sales_order: 'SO-2026-0188',
        quantity_order: 1,
        quantity_unit: { id: 21, lookup_type: 'QUANTITY_UNIT', code: 'BK', label: 'Book', description: null, sort_order: null, is_active: true, attribute: null },
        work_center: { id: 31, lookup_type: 'WORK_CENTER', code: 'MACHINE_A', label: 'Machine A', description: null, sort_order: null, is_active: true, attribute: null },
        planned_start_time: '2026-02-20T08:00:00.000Z',
        release_date: null,
        due_date: '2026-02-21T16:00:00.000Z',
        job_priority: { id: 11, lookup_type: 'JOB_PRIORITY', code: 'HIGH', label: 'High', description: null, sort_order: null, is_active: true, attribute: null },
        notes: '-',
        attribute: null,
      },
    ],
  })
  populated: any[];
}

export class JobOffsetPrinterTaiyoUploadPreviewResponseDto {
  @Expose()
  @ApiProperty({ example: 10 })
  total_rows: number;

  @Expose()
  @ApiProperty({ example: 8 })
  valid_rows: number;

  @Expose()
  @ApiProperty({ example: 2 })
  invalid_rows: number;

  @Expose()
  @ApiProperty({ type: () => JobOffsetPrinterTaiyoUploadPreviewDataDto })
  data: JobOffsetPrinterTaiyoUploadPreviewDataDto;

  @Expose()
  @ApiProperty({ type: () => [JobOffsetPrinterTaiyoImportErrorDto] })
  errors: JobOffsetPrinterTaiyoImportErrorDto[];
}
