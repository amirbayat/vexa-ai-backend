import { BadRequestException, ConflictException, Injectable, NotFoundException } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { PrismaService } from '../../prisma/prisma.service'
import { TokenService } from '../usage/token.service'
import { ZarinpalService } from './zarinpal.service'
import { fa } from '../../i18n/fa'
import { InitiatePaymentDto } from './dto/initiate-payment.dto'

const SUBSCRIPTION_DAYS = 30

@Injectable()
export class PaymentsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly zarinpal: ZarinpalService,
    private readonly tokenService: TokenService,
    private readonly config: ConfigService,
  ) {}

  async initiate(userId: string, dto: InitiatePaymentDto) {
    const plan = await this.prisma.plan.findUnique({ where: { id: dto.planId } })
    if (!plan) throw new NotFoundException(fa.plans.notFound)
    if (!plan.isActive) throw new BadRequestException(fa.plans.notActive)

    const callbackUrl = `${this.config.get('APP_URL')}/api/v1/payments/callback`

    const { authority, paymentUrl } = await this.zarinpal.requestPayment(
      plan.priceMonthly,
      fa.payment.description(plan.name),
      callbackUrl,
    )

    await this.prisma.payment.create({
      data: { userId, planId: dto.planId, amount: plan.priceMonthly, authority },
    })

    return { paymentUrl, authority }
  }

  async verify(authority: string, status: string) {
    const appUrl = this.config.get<string>('APP_URL')

    if (status !== 'OK') {
      const payment = await this.prisma.payment.findUnique({ where: { authority } })
      if (payment) {
        await this.prisma.payment.update({ where: { authority }, data: { status: 'FAILED' } })
      }
      return { redirect: `${appUrl}/payment?status=failed` }
    }

    const payment = await this.prisma.payment.findUnique({
      where: { authority },
      include: { plan: true },
    })

    if (!payment) throw new NotFoundException(fa.payment.notFound)
    if (payment.status === 'COMPLETED') {
      return { redirect: `${appUrl}/payment?status=success&refId=${payment.refId}` }
    }
    if (payment.status !== 'PENDING') throw new BadRequestException(fa.payment.invalidStatus)

    const { success, refId } = await this.zarinpal.verifyPayment(payment.amount, authority)

    if (!success) {
      await this.prisma.payment.update({ where: { authority }, data: { status: 'FAILED' } })
      return { redirect: `${appUrl}/payment?status=failed` }
    }

    const now = new Date()
    const periodEnd = new Date(now.getTime() + SUBSCRIPTION_DAYS * 24 * 60 * 60 * 1000)

    await this.prisma.$transaction(async tx => {
      await tx.payment.update({
        where: { authority },
        data: { status: 'COMPLETED', refId: refId! },
      })

      await tx.subscription.upsert({
        where: { userId: payment.userId },
        create: {
          userId: payment.userId,
          planId: payment.planId,
          status: 'ACTIVE',
          periodStart: now,
          periodEnd,
          cancelAtPeriodEnd: false,
        },
        update: {
          planId: payment.planId,
          status: 'ACTIVE',
          periodStart: now,
          periodEnd,
          cancelAtPeriodEnd: false,
        },
      })
    })

    await this.tokenService.invalidatePlanCache(payment.userId)

    return { redirect: `${appUrl}/payment?status=success&refId=${refId}` }
  }

  findAll(userId: string) {
    return this.prisma.payment.findMany({
      where: { userId },
      include: { plan: { select: { name: true } } },
      orderBy: { createdAt: 'desc' },
    })
  }

  getHistory(userId: string) {
    return this.prisma.payment.findMany({
      where: { userId },
      include: { plan: { select: { name: true } } },
      orderBy: { createdAt: 'desc' },
      take: 20,
    })
  }
}
