import { ApiProperty } from '@nestjs/swagger';

export class EditRoleDto {
  @ApiProperty({
    example: 1,
    description: 'Lookup id for account_role (number or string)',
  })
  roleLookupId: number | string;
}
