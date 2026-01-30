import {
  Controller,
  Get,
  Param,
  Post,
  Body,
  Put,
  Delete,
  Query,
} from '@nestjs/common';
import { ApiTags, ApiOkResponse, ApiResponse } from '@nestjs/swagger';
import { PrismaService } from './prisma.service';
import { User as UserModel, Post as PostModel, Prisma } from '../prisma/generated/client';
import { UserDto } from './dto/user.dto';
import { PostDto } from './dto/post.dto';

@ApiTags('posts')
@Controller()
export class AppController {
  constructor(private readonly prismaService: PrismaService) { }

  @Get('post/:id')
  @ApiOkResponse({ type: PostDto })
  @ApiResponse({ status: 404, description: 'Post not found' })
  async getPostById(@Param('id') id: string): Promise<PostModel> {
    return this.prismaService.post.findUnique({ where: { id: Number(id) } });
  }

  @Get('feed')
  async getFilteredPosts(
    @Query('take') take?: number,
    @Query('skip') skip?: number,
    @Query('searchString') searchString?: string,
    @Query('orderBy') orderBy?: 'asc' | 'desc',
  ): Promise<PostModel[]> {
    const or = searchString
      ? {
        OR: [
          { title: { contains: searchString } },
          { content: { contains: searchString } },
        ],
      }
      : {};

    return this.prismaService.post.findMany({
      where: {
        published: true,
        ...or,
      },
      include: { author: true },
      take: Number(take) || undefined,
      skip: Number(skip) || undefined,
      orderBy: {
        updatedAt: orderBy,
      },
    });
  }

  @Get('users')
  @ApiOkResponse({ type: UserDto, isArray: true })
  async getAllUsers(): Promise<UserModel[]> {
    return this.prismaService.user.findMany();
  }

  @Get('user/:id/drafts')
  @ApiOkResponse({ type: PostDto, isArray: true })
  async getDraftsByUser(@Param('id') id: string): Promise<PostModel[]> {
    return this.prismaService.post.findMany({
      where: { authorId: Number(id), published: false },
    });
  }

  @Post('post')
  @ApiOkResponse({ type: PostDto })
  async createDraft(
    @Body() postData: { title: string; content?: string; authorEmail: string },
  ): Promise<PostModel> {
    const { title, content, authorEmail } = postData;
    return this.prismaService.post.create({
      data: {
        title,
        content,
        author: {
          connect: { email: authorEmail },
        },
      },
    });
  }

  @Post('signup')
  @ApiOkResponse({ type: UserDto })
  async signupUser(
    @Body()
    userData: {
      name?: string;
      email: string;
      posts?: Prisma.PostCreateInput[];
    },
  ): Promise<UserModel> {
    const postData = userData.posts?.map((post) => {
      return { title: post?.title, content: post?.content };
    });
    return this.prismaService.user.create({
      data: {
        name: userData?.name,
        email: userData.email,
        posts: {
          create: postData,
        },
      },
    });
  }

  @Put('publish/:id')
  @ApiOkResponse({ type: PostDto })
  async togglePublishPost(@Param('id') id: string): Promise<PostModel> {
    const postData = await this.prismaService.post.findUnique({
        where: { id: Number(id) },
        select: {
          published: true,
        },
      });

    return this.prismaService.post.update({
      where: { id: Number(id) || undefined },
      data: { published: !postData?.published },
    });
  }

  @Delete('post/:id')
  @ApiOkResponse({ type: PostDto })
  async deletePost(@Param('id') id: string): Promise<PostModel> {
    return this.prismaService.post.delete({ where: { id: Number(id) } });
  }

  @Put('/post/:id/views')
  @ApiOkResponse({ type: PostDto })
  async incrementPostViewCount(@Param('id') id: string): Promise<PostModel> {
    return this.prismaService.post.update({
      where: { id: Number(id) },
      data: {
        viewCount: {
          increment: 1,
        },
      },
    });
  }
}
