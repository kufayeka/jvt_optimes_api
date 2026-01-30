import { Body, Controller, Get, Param, Patch, Post, Put, Query } from '@nestjs/common';
import { LookupService } from './lookup.service';
import {
  ApiTags,
  ApiOkResponse,
  ApiCreatedResponse,
  ApiOperation,
  ApiQuery,
  ApiParam,
  ApiBody,
} from '@nestjs/swagger';
import { CreateLookupDto } from './dto/create-lookup.dto';
import { UpdateLookupDto } from './dto/update-lookup.dto';
import { LookupResponseDto } from './dto/lookup-response.dto';

@ApiTags('Lookups')
@Controller('lookups')
export class LookupController {
  constructor(private readonly svc: LookupService) {}

  @Get()
  @ApiOperation({ summary: 'List lookups' })
  @ApiQuery({ name: 'type', required: false, description: 'Filter by lookup_type (e.g. ACCOUNT_LIFECYCLE)' })
  @ApiOkResponse({ type: [LookupResponseDto] })
  findAll(@Query('type') type?: string) {
    return this.svc.findAll(type);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get lookup by id' })
  @ApiParam({ name: 'id', description: 'Lookup _id (uuid)' })
  @ApiOkResponse({ type: LookupResponseDto })
  findOne(@Param('id') id: string) {
    return this.svc.findOne(id);
  }

  @Post()
  @ApiOperation({ summary: 'Create a new lookup' })
  @ApiBody({ type: CreateLookupDto })
  @ApiCreatedResponse({ type: LookupResponseDto })
  create(@Body() body: CreateLookupDto) {
    return this.svc.create(body as any);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Replace an existing lookup' })
  @ApiParam({ name: 'id', description: 'Lookup _id (uuid)' })
  @ApiBody({ type: UpdateLookupDto })
  @ApiOkResponse({ type: LookupResponseDto })
  update(@Param('id') id: string, @Body() body: UpdateLookupDto) {
    return this.svc.update(id, body as any);
  }

  @Patch(':id/activate')
  @ApiOperation({ summary: 'Activate or deactivate a lookup' })
  @ApiParam({ name: 'id', description: 'Lookup _id (uuid)' })
  @ApiBody({ schema: { properties: { is_active: { type: 'boolean' } } } })
  @ApiOkResponse({ type: LookupResponseDto })
  activate(@Param('id') id: string, @Body('is_active') is_active: boolean) {
    const val = typeof is_active === 'boolean' ? is_active : true;
    return this.svc.setActive(id, val);
  }
}

