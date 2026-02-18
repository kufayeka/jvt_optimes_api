import { Module } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { JobOffsetPrinterTaiyoController } from './job-offset-printer-taiyo.controller';
import { JobOffsetPrinterTaiyoService } from './job-offset-printer-taiyo.service';

@Module({
  controllers: [JobOffsetPrinterTaiyoController],
  providers: [JobOffsetPrinterTaiyoService, PrismaService],
})
export class JobOffsetPrinterTaiyoModule {}
