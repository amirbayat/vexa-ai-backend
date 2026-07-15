import { Controller, Get, Post, Query, UseGuards } from '@nestjs/common'
import { JwtGuard } from '../../common/guards/jwt.guard'
import { AdminGuard } from '../../common/guards/admin.guard'
import { CurrentUser, JwtPayload } from '../../common/decorators/current-user.decorator'
import { NetworkOutageService } from './network-outage.service'

@Controller('admin/network-outage')
@UseGuards(JwtGuard, AdminGuard)
export class NetworkOutageController {
  constructor(private readonly outage: NetworkOutageService) {}

  @Get('current')
  getCurrent() {
    return this.outage.getCurrent()
  }

  @Get('history')
  history(@Query('limit') limit?: string) {
    return this.outage.history(limit ? Number(limit) : 20)
  }

  @Post('start')
  start(@CurrentUser() user: JwtPayload) {
    return this.outage.start(user.sub)
  }

  @Post('end')
  end() {
    return this.outage.end()
  }
}
