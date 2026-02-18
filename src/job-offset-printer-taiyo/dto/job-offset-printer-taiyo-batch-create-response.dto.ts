import { ApiProperty } from '@nestjs/swagger';
import { Expose, Type } from 'class-transformer';
import { JobOffsetPrinterTaiyoImportErrorDto } from './job-offset-printer-taiyo-import-error.dto';
import { JobOffsetPrinterTaiyoResponseDto } from './job-offset-printer-taiyo-response.dto';

export class JobOffsetPrinterTaiyoBatchCreateResponseDto {
  @Expose()
  @ApiProperty({ example: 8 })
  created_count: number;

  @Expose()
  @ApiProperty({ example: 2 })
  failed_count: number;

  @Expose()
  @Type(() => JobOffsetPrinterTaiyoResponseDto)
  @ApiProperty({ type: () => [JobOffsetPrinterTaiyoResponseDto] })
  created: JobOffsetPrinterTaiyoResponseDto[];

  @Expose()
  @Type(() => JobOffsetPrinterTaiyoImportErrorDto)
  @ApiProperty({ type: () => [JobOffsetPrinterTaiyoImportErrorDto] })
  errors: JobOffsetPrinterTaiyoImportErrorDto[];
}
