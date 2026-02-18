import { Body, Controller, Delete, Get, Param, Patch, Post, Put, Res, UploadedFile, UseInterceptors } from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiConsumes,
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
import { FileInterceptor } from '@nestjs/platform-express';
import { Response } from 'express';
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
import { JobOffsetPrinterTaiyoUploadPreviewResponseDto } from './dto/job-offset-printer-taiyo-upload-preview-response.dto';
import { JobOffsetPrinterTaiyoBatchCreateResponseDto } from './dto/job-offset-printer-taiyo-batch-create-response.dto';

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

  @Get('excel/template')
  @ApiOperation({ summary: 'Download excel template for job import' })
  downloadExcelTemplate(@Res() res: Response) {
    const template = this.svc.downloadImportTemplate();
    res.setHeader('Content-Type', template.contentType);
    res.setHeader('Content-Disposition', `attachment; filename="${template.filename}"`);
    res.send(template.buffer);
  }

  @Post('excel/upload-preview')
  @ApiOperation({ summary: 'Upload excel (.xlsx/.xls) and preview valid jobs + row errors' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        file: { type: 'string', format: 'binary' },
      },
      required: ['file'],
    },
  })
  @ApiOkResponse({ type: JobOffsetPrinterTaiyoUploadPreviewResponseDto })
  @ApiBadRequestResponse({ type: ApiErrorResponseDto, description: 'Invalid file or invalid rows' })
  @UseInterceptors(
    FileInterceptor('file', {
      limits: { fileSize: 10 * 1024 * 1024 },
    }),
  )
  uploadExcelPreview(@UploadedFile() file: any) {
    return this.svc.uploadPreviewExcel(file);
  }

  @Post('batch-create')
  @ApiOperation({ summary: 'Batch create jobs from reviewed JSON array' })
  @ApiBody({
    schema: {
      type: 'array',
      items: { type: 'object' },
      example: [
        {
          work_order: 'WO-2026-0001',
          sales_order: 'SO-2026-0188',
          quantity_order: 1,
          quantity_unit: 21,
          work_center: 31,
          planned_start_time: '2026-02-20T08:00:00.000Z',
          release_date: null,
          due_date: '2026-02-21T16:00:00.000Z',
          job_priority: 11,
          notes: '-',
          attribute: null,
        },
      ],
    },
  })
  @ApiOkResponse({ type: JobOffsetPrinterTaiyoBatchCreateResponseDto })
  @ApiBadRequestResponse({ type: ApiErrorResponseDto, description: 'JSON array is invalid' })
  batchCreate(@Body() body: any[]) {
    return this.svc.batchCreateFromJson(body);
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
