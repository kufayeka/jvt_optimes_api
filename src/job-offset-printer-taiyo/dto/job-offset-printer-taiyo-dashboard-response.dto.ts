import { ApiProperty } from '@nestjs/swagger';
import { Expose } from 'class-transformer';

export class JobOffsetPrinterTaiyoDashboardResponseDto {
  @Expose()
  @ApiProperty({ example: 120 })
  total: number;

  @Expose()
  @ApiProperty({ example: 40 })
  scheduled: number;

  @Expose()
  @ApiProperty({ example: 30 })
  released: number;

  @Expose()
  @ApiProperty({ example: 25 })
  running: number;

  @Expose()
  @ApiProperty({ example: 20 })
  completed: number;

  @Expose()
  @ApiProperty({ example: 3 })
  suspended: number;

  @Expose()
  @ApiProperty({ example: 2 })
  other: number;

  @Expose()
  @ApiProperty({ example: '2026-02-18T08:00:00.000Z' })
  generated_at: string;
}
