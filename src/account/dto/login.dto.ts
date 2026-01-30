import { ApiProperty } from '@nestjs/swagger';

export class LoginDto {
  @ApiProperty({ example: 'alice1' })
  username: string;

  @ApiProperty({ example: 'Very$ecureP@ssw0rd!' })
  password: string;
}
