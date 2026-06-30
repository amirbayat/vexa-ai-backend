import { Module } from '@nestjs/common'
import { TokenService } from './token.service'
import { UsageController } from './usage.controller'

@Module({
  controllers: [UsageController],
  providers: [TokenService],
  exports: [TokenService],
})
export class UsageModule {}
