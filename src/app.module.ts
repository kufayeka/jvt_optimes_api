import { Module } from '@nestjs/common'
import { AppController } from './app.controller'
import { PrismaService } from './prisma.service'
import { LookupModule } from './lookup/lookup.module'
import { AccountModule } from './account/account.module'
import { JobOffsetPrinterTaiyoModule } from './job-offset-printer-taiyo/job-offset-printer-taiyo.module'

@Module({
  imports: [LookupModule, AccountModule, JobOffsetPrinterTaiyoModule],
  controllers: [AppController],
  providers: [PrismaService],
})
export class AppModule {}
