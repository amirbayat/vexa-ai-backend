import { Module } from '@nestjs/common'
import { NetworkOutageService } from './network-outage.service'
import { NetworkOutageController } from './network-outage.controller'

@Module({
  controllers: [NetworkOutageController],
  providers: [NetworkOutageService],
})
export class NetworkOutageModule {}
