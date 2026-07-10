import { Body, Controller, Get, Param, Patch, Post, Query, UseGuards } from '@nestjs/common'
import { JwtGuard } from '../../common/guards/jwt.guard'
import { AdminGuard } from '../../common/guards/admin.guard'
import { SalesAdminService } from './sales-admin.service'
import { UpdateSalesBotConfigDto, UpdateLeadFollowUpDto, SendLeadSmsDto } from './dto/sales-admin.dto'

@Controller('admin/sales-bot')
@UseGuards(JwtGuard, AdminGuard)
export class SalesAdminController {
  constructor(private readonly salesAdminService: SalesAdminService) {}

  @Get('config')
  getConfig() {
    return this.salesAdminService.getConfig()
  }

  @Patch('config')
  updateConfig(@Body() dto: UpdateSalesBotConfigDto) {
    return this.salesAdminService.updateConfig(dto)
  }

  @Get('analytics/overview')
  getAnalyticsOverview(@Query('from') from: string, @Query('to') to: string) {
    return this.salesAdminService.getAnalyticsOverview(from, to)
  }

  @Get('analytics/timeseries')
  getAnalyticsTimeseries(@Query('from') from: string, @Query('to') to: string) {
    return this.salesAdminService.getAnalyticsTimeseries(from, to)
  }

  @Get('leads')
  getLeads(
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('status') status?: string,
  ) {
    return this.salesAdminService.getLeads(page ? Number(page) : 1, limit ? Number(limit) : 20, status)
  }

  @Patch('leads/:id')
  updateLeadFollowUp(@Param('id') id: string, @Body() dto: UpdateLeadFollowUpDto) {
    return this.salesAdminService.updateLeadFollowUp(id, dto.followUpStatus)
  }

  @Post('leads/:id/sms')
  sendLeadSms(@Param('id') id: string, @Body() dto: SendLeadSmsDto) {
    return this.salesAdminService.sendLeadSms(id, dto.message)
  }
}
