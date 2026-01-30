import { ApiProperty } from '@nestjs/swagger'

export class PostDto {
  @ApiProperty()
  id: number

  @ApiProperty()
  createdAt: Date

  @ApiProperty()
  updatedAt: Date

  @ApiProperty()
  title: string

  @ApiProperty({ required: false })
  content?: string

  @ApiProperty()
  published: boolean

  @ApiProperty()
  viewCount: number

  @ApiProperty({ required: false })
  authorId?: number
}
