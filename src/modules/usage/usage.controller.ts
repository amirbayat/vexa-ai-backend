import { Controller, Get, Query, UseGuards } from '@nestjs/common'
import { JwtGuard } from '../../common/guards/jwt.guard'
import { CurrentUser, JwtPayload } from '../../common/decorators/current-user.decorator'
import { TokenService } from './token.service'

@Controller('usage')
@UseGuards(JwtGuard)
export class UsageController {
  constructor(private readonly tokenService: TokenService) {}

  @Get('today')
  getToday(@CurrentUser() user: JwtPayload) {
    return this.tokenService.getUsageToday(user.sub)
  }

  @Get('history')
  getHistory(@CurrentUser() user: JwtPayload, @Query('month') month?: string) {
    return this.tokenService.getUsageHistory(user.sub, month)
  }
}
