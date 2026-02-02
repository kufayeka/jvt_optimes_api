import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Expose } from 'class-transformer';


export class ApiNotFoundResponseDto {
  @Expose()
  @ApiProperty({ example: 404 })
  statusCode: number;

  @Expose()
  @ApiProperty({ example: 'Not Found' })
  error: string;

  @Expose()
  @ApiProperty({ example: 'Data Not Found' })
  message: string | string[];
}
