import { Body, Controller, Delete, Get, Param, Patch, Post, Put, Query } from '@nestjs/common';
import { LookupService } from './lookup.service';
import {
  ApiTags,
  ApiOkResponse,
  ApiCreatedResponse,
  ApiOperation,
  ApiQuery,
  ApiParam,
  ApiBody,
  ApiBadRequestResponse,
  ApiNotFoundResponse,
} from '@nestjs/swagger';
import { CreateLookupDto } from './dto/create-lookup.dto';
import { UpdateLookupDto } from './dto/update-lookup.dto';
import { LookupResponseDto } from './dto/lookup-response.dto';
import { LookupDeleteResponseDto } from './dto/lookup-delete-response.dto';
import { Serialize } from '../common/decorators/serialize.decorator';
import { ApiErrorResponseDto } from '../common/dto/api-error-response.dto';

@ApiTags('Lookups')
@Controller('lookups')
export class LookupController {
  constructor(private readonly svc: LookupService) {}

  @Get()
  @ApiOperation({ summary: 'List lookups' })
  @ApiQuery({ name: 'type', required: false, description: 'Filter by lookup_type (e.g. ACCOUNT_LIFECYCLE)' })
  @ApiOkResponse({ type: [LookupResponseDto] })
  @Serialize(LookupResponseDto)
  findAll(@Query('type') type?: string) {
    return this.svc.findAll(type);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get lookup by id' })
  @ApiParam({ name: 'id', description: 'Lookup ID (integer)' })
  @ApiOkResponse({ type: LookupResponseDto })
  @ApiBadRequestResponse({ type: ApiErrorResponseDto, description: 'Invalid ID format' })
  @ApiNotFoundResponse({ type: ApiErrorResponseDto, description: 'Lookup not found' })
  @Serialize(LookupResponseDto)
  findOne(@Param('id') id: string) {
    return this.svc.findOne(id);
  }

  @Post()
  @ApiOperation({ summary: 'Create a new lookup' })
  @ApiBody({ type: CreateLookupDto })
  @ApiCreatedResponse({ type: LookupResponseDto })
  @ApiBadRequestResponse({
    type: ApiErrorResponseDto,
    description: 'Validation failed (missing/invalid fields)',
    schema: {
      example: {
        statusCode: 400,
        error: 'Bad Request',
        message: 'Validation failed',
        details: [{ field: 'lookup_type', message: 'lookup_type is required' }],
      },
    },
  })
  @Serialize(LookupResponseDto)
  create(@Body() body: CreateLookupDto) {
    return this.svc.create(body as any);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Replace an existing lookup' })
  @ApiParam({ name: 'id', description: 'Lookup ID (integer)' })
  @ApiBody({ type: UpdateLookupDto })
  @ApiOkResponse({ type: LookupResponseDto })
  @ApiNotFoundResponse({ type: ApiErrorResponseDto, description: 'Lookup not found' })
  @ApiBadRequestResponse({
    type: ApiErrorResponseDto,
    description: 'Validation failed (invalid ID format, no fields, or invalid fields)',
    schema: {
      example: {
        statusCode: 400,
        error: 'Bad Request',
        message: 'Validation failed',
        details: [{ field: 'body', message: 'At least one field is required' }],
      },
    },
  })
  @Serialize(LookupResponseDto)
  update(@Param('id') id: string, @Body() body: UpdateLookupDto) {
    return this.svc.update(id, body as any);
  }

  @Patch(':id/activate')
  @ApiOperation({ summary: 'Activate or deactivate a lookup' })
  @ApiParam({ name: 'id', description: 'Lookup ID (integer)' })
  @ApiBody({ schema: { properties: { is_active: { type: 'boolean' } } } })
  @ApiOkResponse({ type: LookupResponseDto })
  @ApiNotFoundResponse({ type: ApiErrorResponseDto, description: 'Lookup not found' })
  @ApiBadRequestResponse({
    type: ApiErrorResponseDto,
    description: 'Validation failed (invalid ID format or is_active must be boolean)',
    schema: {
      example: {
        statusCode: 400,
        error: 'Bad Request',
        message: 'Validation failed',
        details: [{ field: 'is_active', message: 'is_active must be boolean' }],
      },
    },
  })
  @Serialize(LookupResponseDto)
  activate(@Param('id') id: string, @Body('is_active') is_active: boolean) {
    return this.svc.setActive(id, is_active);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete lookup by id' })
  @ApiParam({ name: 'id', description: 'Lookup ID (integer)' })
  @ApiOkResponse({ type: LookupDeleteResponseDto })
  @ApiBadRequestResponse({ type: ApiErrorResponseDto, description: 'Invalid ID format' })
  @ApiNotFoundResponse({ type: ApiErrorResponseDto, description: 'Lookup not found' })
  @Serialize(LookupDeleteResponseDto)
  remove(@Param('id') id: string) {
    return this.svc.remove(id);
  }
}
