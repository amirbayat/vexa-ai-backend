import { Body, Controller, Get, Param, Patch, Query, UseGuards } from '@nestjs/common'
import { JwtGuard } from '../../common/guards/jwt.guard'
import { AdminGuard } from '../../common/guards/admin.guard'
import { AdminService } from './admin.service'

@Controller('admin')
@UseGuards(JwtGuard, AdminGuard)
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  @Get('dashboard')
  getDashboard() {
    return this.adminService.getDashboard()
  }

  @Get('users')
  getUsers(
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('search') search?: string,
  ) {
    return this.adminService.getUsers(page ? Number(page) : 1, limit ? Number(limit) : 20, search)
  }

  @Patch('users/:id')
  updateUser(
    @Param('id') id: string,
    @Body() body: { isActive?: boolean; role?: 'USER' | 'ADMIN' },
  ) {
    return this.adminService.updateUser(id, body)
  }

  @Get('token-stats')
  getTokenStats() {
    return this.adminService.getTokenStats()
  }

  @Get('revenue')
  getRevenue() {
    return this.adminService.getRevenueStats()
  }
}
