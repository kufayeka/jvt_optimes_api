import { ApiProperty } from '@nestjs/swagger';

export class ResetPasswordDto {
  @ApiProperty({
    example: '2026-06-30T00:00:00.000Z',
    description: 'Password expiry time (ISO). Can be set by system/admin.',
  })
  password_expiry_time: string;
}
