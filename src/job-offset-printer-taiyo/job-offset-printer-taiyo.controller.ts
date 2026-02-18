import { Body, Controller, Delete, Get, Param, Patch, Post, Put } from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiConflictResponse,
  ApiCreatedResponse,
  ApiForbiddenResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiParam,
  ApiTags,
  ApiBody,
} from '@nestjs/swagger';
import { Serialize } from '../common/decorators/serialize.decorator';
import { ApiErrorResponseDto } from '../common/dto/api-error-response.dto';
import { CreateJobOffsetPrinterTaiyoDto } from './dto/create-job-offset-printer-taiyo.dto';
import { UpdateJobOffsetPrinterTaiyoDto } from './dto/update-job-offset-printer-taiyo.dto';
import { JobOffsetPrinterTaiyoService } from './job-offset-printer-taiyo.service';
import { JobOffsetPrinterTaiyoListResponseDto } from './dto/job-offset-printer-taiyo-list-response.dto';
import { JobOffsetPrinterTaiyoGetResponseDto } from './dto/job-offset-printer-taiyo-get-response.dto';
import { JobOffsetPrinterTaiyoCreateResponseDto } from './dto/job-offset-printer-taiyo-create-response.dto';
import { JobOffsetPrinterTaiyoUpdateResponseDto } from './dto/job-offset-printer-taiyo-update-response.dto';
import { JobOffsetPrinterTaiyoLifecycleResponseDto } from './dto/job-offset-printer-taiyo-lifecycle-response.dto';
import { JobOffsetPrinterTaiyoDeleteResponseDto } from './dto/job-offset-printer-taiyo-delete-response.dto';
import { JobOffsetPrinterTaiyoDashboardResponseDto } from './dto/job-offset-printer-taiyo-dashboard-response.dto';

@ApiTags('Job Offset Printer Taiyo')
@Controller('jobs/offset-printer-taiyo')
export class JobOffsetPrinterTaiyoController {
  constructor(private svc: JobOffsetPrinterTaiyoService) {}

  @Get()
  @ApiOperation({ summary: 'Get all jobs' })
  @ApiOkResponse({ type: [JobOffsetPrinterTaiyoListResponseDto] })
  @Serialize(JobOffsetPrinterTaiyoListResponseDto)
  getAll() {
    return this.svc.getAll();
  }

  @Get('dashboard')
  @ApiOperation({ summary: 'Job dashboard summary' })
  @ApiOkResponse({ type: JobOffsetPrinterTaiyoDashboardResponseDto })
  @Serialize(JobOffsetPrinterTaiyoDashboardResponseDto)
  getDashboard() {
    return this.svc.getDashboard();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get job by id' })
  @ApiParam({ name: 'id', description: 'Job ID (UUID)' })
  @ApiOkResponse({ type: JobOffsetPrinterTaiyoGetResponseDto })
  @ApiBadRequestResponse({ type: ApiErrorResponseDto, description: 'Invalid UUID format' })
  @ApiNotFoundResponse({ type: ApiErrorResponseDto, description: 'Job not found' })
  @Serialize(JobOffsetPrinterTaiyoGetResponseDto)
  getById(@Param('id') id: string) {
    return this.svc.getById(id);
  }

  @Post()
  @ApiOperation({
    summary: 'Create job',
    description:
      'Business rules: work_order must be unique; planned_start_time cannot be the same if work_center is the same. Initial lifecycle is always SCHEDULED.',
  })
  @ApiBody({ type: CreateJobOffsetPrinterTaiyoDto })
  @ApiCreatedResponse({ type: JobOffsetPrinterTaiyoCreateResponseDto })
  @ApiBadRequestResponse({ type: ApiErrorResponseDto, description: 'Validation failed' })
  @ApiConflictResponse({ type: ApiErrorResponseDto, description: 'work_order duplicate or schedule conflict' })
  @Serialize(JobOffsetPrinterTaiyoCreateResponseDto)
  create(@Body() body: CreateJobOffsetPrinterTaiyoDto) {
    return this.svc.add(body as any);
  }

  @Put(':id')
  @ApiOperation({
    summary: 'Edit job',
    description: 'Edit is allowed only when job status is SCHEDULED.',
  })
  @ApiParam({ name: 'id', description: 'Job ID (UUID)' })
  @ApiBody({ type: UpdateJobOffsetPrinterTaiyoDto })
  @ApiOkResponse({ type: JobOffsetPrinterTaiyoUpdateResponseDto })
  @ApiBadRequestResponse({ type: ApiErrorResponseDto, description: 'Validation failed or invalid UUID' })
  @ApiNotFoundResponse({ type: ApiErrorResponseDto, description: 'Job not found' })
  @ApiConflictResponse({ type: ApiErrorResponseDto, description: 'work_order duplicate or schedule conflict' })
  @ApiForbiddenResponse({ type: ApiErrorResponseDto, description: 'Job is not SCHEDULED' })
  @Serialize(JobOffsetPrinterTaiyoUpdateResponseDto)
  update(@Param('id') id: string, @Body() body: UpdateJobOffsetPrinterTaiyoDto) {
    return this.svc.update(id, body as any);
  }

  @Delete(':id')
  @ApiOperation({
    summary: 'Delete job',
    description: 'Delete is allowed only when job status is SCHEDULED.',
  })
  @ApiParam({ name: 'id', description: 'Job ID (UUID)' })
  @ApiOkResponse({ type: JobOffsetPrinterTaiyoDeleteResponseDto })
  @ApiBadRequestResponse({ type: ApiErrorResponseDto, description: 'Invalid UUID format' })
  @ApiNotFoundResponse({ type: ApiErrorResponseDto, description: 'Job not found' })
  @ApiForbiddenResponse({ type: ApiErrorResponseDto, description: 'Job is not SCHEDULED' })
  @Serialize(JobOffsetPrinterTaiyoDeleteResponseDto)
  remove(@Param('id') id: string) {
    return this.svc.remove(id);
  }

  @Patch(':id/release')
  @ApiOperation({ summary: 'Release job', description: 'Allowed transition: SCHEDULED -> RELEASED' })
  @ApiParam({ name: 'id', description: 'Job ID (UUID)' })
  @ApiOkResponse({ type: JobOffsetPrinterTaiyoLifecycleResponseDto })
  @ApiBadRequestResponse({ type: ApiErrorResponseDto, description: 'Invalid UUID format' })
  @ApiNotFoundResponse({ type: ApiErrorResponseDto, description: 'Job not found' })
  @ApiForbiddenResponse({ type: ApiErrorResponseDto, description: 'Transition not allowed' })
  @Serialize(JobOffsetPrinterTaiyoLifecycleResponseDto)
  release(@Param('id') id: string) {
    return this.svc.release(id);
  }

  @Patch(':id/run')
  @ApiOperation({ summary: 'Run job', description: 'Allowed transition: RELEASED -> RUNNING' })
  @ApiParam({ name: 'id', description: 'Job ID (UUID)' })
  @ApiOkResponse({ type: JobOffsetPrinterTaiyoLifecycleResponseDto })
  @ApiBadRequestResponse({ type: ApiErrorResponseDto, description: 'Invalid UUID format' })
  @ApiNotFoundResponse({ type: ApiErrorResponseDto, description: 'Job not found' })
  @ApiForbiddenResponse({ type: ApiErrorResponseDto, description: 'Transition not allowed' })
  @Serialize(JobOffsetPrinterTaiyoLifecycleResponseDto)
  run(@Param('id') id: string) {
    return this.svc.run(id);
  }

  @Patch(':id/suspend')
  @ApiOperation({ summary: 'Suspend job', description: 'Allowed transition: RELEASED/RUNNING -> SUSPENDED' })
  @ApiParam({ name: 'id', description: 'Job ID (UUID)' })
  @ApiOkResponse({ type: JobOffsetPrinterTaiyoLifecycleResponseDto })
  @ApiBadRequestResponse({ type: ApiErrorResponseDto, description: 'Invalid UUID format' })
  @ApiNotFoundResponse({ type: ApiErrorResponseDto, description: 'Job not found' })
  @ApiForbiddenResponse({ type: ApiErrorResponseDto, description: 'Transition not allowed' })
  @Serialize(JobOffsetPrinterTaiyoLifecycleResponseDto)
  suspend(@Param('id') id: string) {
    return this.svc.suspend(id);
  }

  @Patch(':id/complete')
  @ApiOperation({ summary: 'Complete job', description: 'Allowed transition: RUNNING/SUSPENDED -> COMPLETED' })
  @ApiParam({ name: 'id', description: 'Job ID (UUID)' })
  @ApiOkResponse({ type: JobOffsetPrinterTaiyoLifecycleResponseDto })
  @ApiBadRequestResponse({ type: ApiErrorResponseDto, description: 'Invalid UUID format' })
  @ApiNotFoundResponse({ type: ApiErrorResponseDto, description: 'Job not found' })
  @ApiForbiddenResponse({ type: ApiErrorResponseDto, description: 'Transition not allowed' })
  @Serialize(JobOffsetPrinterTaiyoLifecycleResponseDto)
  complete(@Param('id') id: string) {
    return this.svc.complete(id);
  }

  @Patch(':id/close')
  @ApiOperation({ summary: 'Close job', description: 'Allowed transition: RELEASED/COMPLETED -> CLOSED' })
  @ApiParam({ name: 'id', description: 'Job ID (UUID)' })
  @ApiOkResponse({ type: JobOffsetPrinterTaiyoLifecycleResponseDto })
  @ApiBadRequestResponse({ type: ApiErrorResponseDto, description: 'Invalid UUID format' })
  @ApiNotFoundResponse({ type: ApiErrorResponseDto, description: 'Job not found' })
  @ApiForbiddenResponse({ type: ApiErrorResponseDto, description: 'Transition not allowed' })
  @Serialize(JobOffsetPrinterTaiyoLifecycleResponseDto)
  close(@Param('id') id: string) {
    return this.svc.close(id);
  }
}
