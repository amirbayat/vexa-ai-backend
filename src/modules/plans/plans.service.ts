import { Injectable, NotFoundException } from '@nestjs/common'
import { Prisma } from '@prisma/client'
import { PrismaService } from '../../prisma/prisma.service'
import { fa } from '../../i18n/fa'
import { CreatePlanDto } from './dto/create-plan.dto'
import { UpdatePlanDto } from './dto/update-plan.dto'

@Injectable()
export class PlansService {
  constructor(private readonly prisma: PrismaService) {}

  findAll() {
    return this.prisma.plan.findMany({
      where: { isActive: true },
      orderBy: { sortOrder: 'asc' },
    })
  }

  findAllAdmin() {
    return this.prisma.plan.findMany({
      orderBy: { sortOrder: 'asc' },
    })
  }

  async findOne(id: string) {
    const plan = await this.prisma.plan.findUnique({ where: { id } })
    if (!plan) throw new NotFoundException(fa.plans.notFound)
    return plan
  }

  create(dto: CreatePlanDto) {
    return this.prisma.plan.create({
      data: {
        name: dto.name,
        priceMonthly: dto.priceMonthly,
        dailyFreeTokens: dto.dailyFreeTokens,
        monthlyTotalTokens: dto.monthlyTotalTokens,
        allowedModels: dto.allowedModels,
        features: (dto.features ?? {}) as Prisma.InputJsonValue,
        isActive: dto.isActive,
        sortOrder: dto.sortOrder,
      },
    })
  }

  async update(id: string, dto: UpdatePlanDto) {
    await this.findOne(id)
    const { features, ...rest } = dto
    return this.prisma.plan.update({
      where: { id },
      data: {
        ...rest,
        ...(features !== undefined && { features: features as Prisma.InputJsonValue }),
      },
    })
  }

  async remove(id: string) {
    await this.findOne(id)
    return this.prisma.plan.delete({ where: { id } })
  }
}
