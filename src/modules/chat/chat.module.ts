import { Module } from '@nestjs/common'
import { ChatService } from './chat.service'
import { ChatController } from './chat.controller'
import { UsageModule } from '../usage/usage.module'

@Module({
  imports: [UsageModule],
  controllers: [ChatController],
  providers: [ChatService],
})
export class ChatModule {}
