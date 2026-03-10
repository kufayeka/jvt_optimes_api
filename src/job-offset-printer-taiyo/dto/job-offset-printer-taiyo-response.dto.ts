import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Expose, Type } from 'class-transformer';
import { LookupResponseDto } from '../../lookup/dto/lookup-response.dto';

export class JobOffsetPrinterTaiyoResponseDto {
  @Expose()
  @ApiProperty({ example: '3fa85f64-5717-4562-b3fc-2c963f66afa6' })
  id: string;

  @Expose()
  @ApiProperty({ example: 'WO-2026-0001' })
  work_order: string;

  @Expose()
  @ApiProperty({ example: 'SO-2026-0188' })
  sales_order: string;

  @Expose()
  @ApiProperty({ example: 1 })
  quantity_order: number;

  @Expose()
  @Type(() => LookupResponseDto)
  @ApiProperty({ type: () => LookupResponseDto, description: 'Populated lookup object for quantity_unit' })
  quantity_unit: LookupResponseDto | null;

  @Expose()
  @Type(() => LookupResponseDto)
  @ApiProperty({ type: () => LookupResponseDto, description: 'Populated lookup object for work_center' })
  work_center: LookupResponseDto | null;

  @Expose()
  @ApiProperty({ example: '2026-02-20T08:00:00.000Z' })
  planned_start_time: string;

  @Expose()
  @ApiPropertyOptional({ example: '2026-02-19T09:00:00.000Z' })
  scheduled_date?: string | null;

  @Expose()
  @ApiPropertyOptional({ example: '2026-02-20T08:10:00.000Z' })
  release_date?: string | null;

  @Expose()
  @ApiPropertyOptional({ example: '2026-02-20T08:30:00.000Z' })
  run_date?: string | null;

  @Expose()
  @ApiPropertyOptional({ example: '2026-02-20T10:00:00.000Z' })
  suspend_date?: string | null;

  @Expose()
  @ApiPropertyOptional({ example: '2026-02-20T12:00:00.000Z' })
  complete_date?: string | null;

  @Expose()
  @ApiPropertyOptional({ example: null, nullable: true })
  cancel_date?: string | null;

  @Expose()
  @ApiPropertyOptional({ example: null, nullable: true })
  close_date?: string | null;

  @Expose()
  @ApiPropertyOptional({ example: '2026-02-21T16:00:00.000Z' })
  due_date?: string | null;

  @Expose()
  @Type(() => LookupResponseDto)
  @ApiProperty({ type: () => LookupResponseDto, description: 'Populated lookup object for job_priority' })
  job_priority: LookupResponseDto | null;

  @Expose()
  @Type(() => LookupResponseDto)
  @ApiProperty({ type: () => LookupResponseDto, description: 'Populated lookup object for job_lifecycle_state' })
  job_lifecycle_state: LookupResponseDto | null;

  @Expose()
  @ApiProperty({ example: '-' })
  notes: string;

  @Expose()
  @ApiPropertyOptional({ example: { customer: 'ABC', color: 'CMYK' } })
  attribute?: any | null;
}
