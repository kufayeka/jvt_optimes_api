import { ApiProperty } from '@nestjs/swagger';
import { Expose } from 'class-transformer';
import { JobOffsetPrinterTaiyoImportErrorDto } from './job-offset-printer-taiyo-import-error.dto';

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
  @ApiProperty({
    type: 'array',
    items: { type: 'object' },
    example: [
      {
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
  data: any[];

  @Expose()
  @ApiProperty({ type: () => [JobOffsetPrinterTaiyoImportErrorDto] })
  errors: JobOffsetPrinterTaiyoImportErrorDto[];
}
