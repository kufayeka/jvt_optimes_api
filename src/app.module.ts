import { Module } from '@nestjs/common'
import { AppController } from './app.controller'
import { PrismaService } from './prisma.service'
import { LookupModule } from './lookup/lookup.module'
import { AccountModule } from './account/account.module'

@Module({
  imports: [LookupModule, AccountModule],
  controllers: [AppController],
  providers: [PrismaService],
})
export class AppModule {}
