import { Module } from '@nestjs/common'
import { BullModule } from '@nestjs/bull'
import { ConfigModule, ConfigService } from '@nestjs/config'
import { QueueService } from './queue.service'
import { TokenFlushProcessor } from './processors/token-flush.processor'
import { FeedbackSummaryProcessor } from './processors/feedback-summary.processor'
import { PrismaModule } from '../prisma/prisma.module'

@Module({
  imports: [
    BullModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        redis: config.get<string>('REDIS_URL'),
      }),
    }),
    BullModule.registerQueue({ name: 'token-flush' }),
    BullModule.registerQueue({ name: 'feedback-summary' }),
    PrismaModule,
  ],
  providers: [QueueService, TokenFlushProcessor, FeedbackSummaryProcessor],
})
export class QueueModule {}
