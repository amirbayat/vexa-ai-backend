import { Controller, ForbiddenException, Get, Post, UseGuards } from '@nestjs/common'
import { DiscountSource } from '@prisma/client'
import { JwtGuard } from '../../common/guards/jwt.guard'
import { CurrentUser, JwtPayload } from '../../common/decorators/current-user.decorator'
import { PrismaService } from '../../prisma/prisma.service'
import { TokenService } from '../usage/token.service'
import { OnboardingGiftService } from './onboarding-gift.service'
import { GrowthConfigService } from './growth-config.service'
import { DiscountCodeService } from './discount-code.service'
import { fa } from '../../i18n/fa'

@Controller('growth')
export class GrowthPublicController {
  constructor(
    private readonly onboardingGift: OnboardingGiftService,
    private readonly growthConfig: GrowthConfigService,
    private readonly discountCode: DiscountCodeService,
    private readonly tokenService: TokenService,
    private readonly prisma: PrismaService,
  ) {}

  @Get('onboarding-gift')
  async getGift() {
    const gift = await this.onboardingGift.getGift()
    if (!gift.isActive) return { isActive: false as const }
    return gift
  }

  private async isEligibleForWelcomeGift(userId: string): Promise<boolean> {
    const [plan, dbUser] = await Promise.all([
      this.tokenService.getCachedPlan(userId),
      this.prisma.user.findUniqueOrThrow({
        where: { id: userId },
        select: { lifetimeMessageCount: true },
      }),
    ])
    return plan.trialMessageThreshold !== null && dbUser.lifetimeMessageCount < plan.trialMessageThreshold
  }

  // برای بنر هدیه در صفحه‌ی چت — یک درخواست، هم واجدشرایط‌بودن هم محتوای هدیه را می‌دهد
  @Get('onboarding-gift/status')
  @UseGuards(JwtGuard)
  async getGiftStatus(@CurrentUser() user: JwtPayload) {
    const [gift, eligible] = await Promise.all([
      this.onboardingGift.getGift(),
      this.isEligibleForWelcomeGift(user.sub),
    ])
    const show = eligible && gift.isActive
    return { eligible: show, gift: show ? gift : null }
  }

  // چک واجدشرایط‌بودن (docs/PRD-growth-traction-features.md بخش ۴.۳) سمت سرور دوباره
  // انجام می‌شود — به فرانت اعتماد نمی‌کنیم که فقط زیر آستانه بنر رو نشون داده
  @Post('onboarding-gift/claim')
  @UseGuards(JwtGuard)
  async claimGift(@CurrentUser() user: JwtPayload) {
    const eligible = await this.isEligibleForWelcomeGift(user.sub)
    if (!eligible) throw new ForbiddenException(fa.discount.notEligible)

    const config = await this.growthConfig.getConfig()
    const code = await this.discountCode.issuePersonalCode({
      userId: user.sub,
      source: DiscountSource.WELCOME_GIFT,
      discountPercent: config.welcomeDiscountPercent,
      validHours: config.welcomeDiscountValidHours,
    })

    return { code: code.code, discountPercent: code.discountPercent, expiresAt: code.expiresAt }
  }
}
