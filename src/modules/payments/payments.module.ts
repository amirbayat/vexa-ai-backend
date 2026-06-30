import { Module } from '@nestjs/common'
import { PaymentsService } from './payments.service'
import { PaymentsController } from './payments.controller'
import { ZarinpalService } from './zarinpal.service'
import { UsageModule } from '../usage/usage.module'

@Module({
  imports: [UsageModule],
  controllers: [PaymentsController],
  providers: [PaymentsService, ZarinpalService],
})
export class PaymentsModule {}
