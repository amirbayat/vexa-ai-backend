import { Body, Controller, Get, Post, Query, Redirect, UseGuards } from '@nestjs/common'
import { JwtGuard } from '../../common/guards/jwt.guard'
import { CurrentUser, JwtPayload } from '../../common/decorators/current-user.decorator'
import { PaymentsService } from './payments.service'
import { InitiatePaymentDto } from './dto/initiate-payment.dto'

@Controller('payments')
export class PaymentsController {
  constructor(private readonly paymentsService: PaymentsService) {}

  @Post('initiate')
  @UseGuards(JwtGuard)
  initiate(@CurrentUser() user: JwtPayload, @Body() dto: InitiatePaymentDto) {
    return this.paymentsService.initiate(user.sub, dto)
  }

  @Get('callback')
  @Redirect()
  async callback(
    @Query('Authority') authority: string,
    @Query('Status') status: string,
  ) {
    const result = await this.paymentsService.verify(authority, status)
    return { url: result.redirect }
  }

  @Get()
  @UseGuards(JwtGuard)
  findAll(@CurrentUser() user: JwtPayload) {
    return this.paymentsService.findAll(user.sub)
  }

  @Get('history')
  @UseGuards(JwtGuard)
  getHistory(@CurrentUser() user: JwtPayload) {
    return this.paymentsService.getHistory(user.sub)
  }
}
