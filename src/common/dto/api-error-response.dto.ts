import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Expose } from 'class-transformer';

export class ApiErrorDetailDto {
  @Expose()
  @ApiProperty({ example: 'username' })
  field: string;

  @Expose()
  @ApiProperty({ example: 'username is a required field' })
  message: string;
}

export class ApiErrorResponseDto {
  @Expose()
  @ApiProperty({ example: 400 })
  statusCode: number;

  @Expose()
  @ApiProperty({ example: 'Bad Request' })
  error: string;

  @Expose()
  @ApiProperty({ example: 'Validation failed' })
  message: string | string[];

  @Expose()
  @ApiPropertyOptional({ type: [ApiErrorDetailDto] })
  details?: ApiErrorDetailDto[];

  @Expose()
  @ApiPropertyOptional({ example: '/api/accounts' })
  path?: string;
}
