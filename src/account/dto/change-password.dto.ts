import { ApiProperty } from '@nestjs/swagger';

export class ChangePasswordDto {
  @ApiProperty({
    example: 'OldP@ssw0rd123!',
    description: 'Current password for validation',
  })
  currentPassword: string;

  @ApiProperty({
    example: 'Very$ecureP@ssw0rd!',
    description: 'Password complexity: min 12 chars, upper/lower/number/symbol. Regex: ^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&#^()_+\-=[\]{}|;:,.<>])[A-Za-z\d@$!%*?&#^()_+\-=[\]{}|;:,.<>]{12,}$',
  })
  newPassword: string;
}
