import { ApiProperty } from '@nestjs/swagger';
import { Expose } from 'class-transformer';

export class OkResponseDto {
  @Expose()
  @ApiProperty({ example: true })
  ok: boolean;
}
