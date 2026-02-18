import { ApiProperty } from '@nestjs/swagger';
import { Expose } from 'class-transformer';

export class AccountDashboardResponseDto {
  @Expose()
  @ApiProperty({ example: 120 })
  total: number;

  @Expose()
  @ApiProperty({ example: 80 })
  active: number;

  @Expose()
  @ApiProperty({ example: 10 })
  disabled: number;

  @Expose()
  @ApiProperty({ example: 15 })
  created: number;

  @Expose()
  @ApiProperty({ example: 5 })
  expired: number;

  @Expose()
  @ApiProperty({ example: 2 })
  deleted: number;

  @Expose()
  @ApiProperty({ example: 8 })
  other: number;

  @Expose()
  @ApiProperty({ example: '2026-02-02T10:00:00.000Z' })
  generated_at: string;
}
