import { ApiProperty } from '@nestjs/swagger';

export class EditRoleDto {

  @ApiProperty({ example: '1', type: 'string | number' })
  roleLookupId: string | number;
}
