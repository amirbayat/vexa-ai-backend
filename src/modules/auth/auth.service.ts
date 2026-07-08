import {
  HttpException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { JwtService } from '@nestjs/jwt'
import * as crypto from 'crypto'
import { PrismaService } from '../../prisma/prisma.service'
import { RedisService } from '../../redis/redis.service'
import { SmsService } from '../../sms/sms.service'
import { CampaignService } from '../campaign/campaign.service'
import { fa } from '../../i18n/fa'

const OTP_TTL = 120        // seconds — 2 min
const OTP_RATE_LIMIT = 3   // max sends per window
const OTP_RATE_WINDOW = 600 // 10 min
const OTP_ATTEMPT_LIMIT = 5
const OTP_ATTEMPT_WINDOW = 1800 // 30 min

// حساب تستی ثابت — بدون ارسال پیامک واقعی، بدون rate limit
// فقط وقتی env variable به نام TEST_USER برابر 'true' باشد فعال است (پیش‌فرض: غیرفعال)
const TEST_PHONE = '09001111111'
const TEST_OTP_CODE = '123654'
const TEST_USER_NAME = 'تست'

function normalizePhone(phone: string): string {
  return phone.replace(/^\+98/, '0').replace(/^98/, '0')
}

function otpKey(phone: string) { return `otp:${phone}` }
function otpRateKey(phone: string) { return `otp:rate:${phone}` }
function otpAttemptKey(phone: string) { return `otp:attempt:${phone}` }

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly redis: RedisService,
    private readonly jwt: JwtService,
    private readonly config: ConfigService,
    private readonly sms: SmsService,
    private readonly campaign: CampaignService,
  ) {}

  private isTestUserEnabled(): boolean {
    return this.config.get<string>('TEST_USER', 'false') === 'true'
  }

  async sendOtp(rawPhone: string): Promise<{ message: string }> {
    const phone = normalizePhone(rawPhone)

    if (phone === TEST_PHONE && this.isTestUserEnabled()) {
      return { message: fa.auth.otpSent }
    }

    // rate limit: max 3 sends / 10min
    const rateKey = otpRateKey(phone)
    const sends = await this.redis.incr(rateKey)
    if (sends === 1) await this.redis.expire(rateKey, OTP_RATE_WINDOW)
    if (sends > OTP_RATE_LIMIT) {
      throw new HttpException(fa.auth.otpTooManyRequests, 429)
    }

    const code = Math.floor(100000 + Math.random() * 900000).toString()
    await this.redis.set(otpKey(phone), code, 'EX', OTP_TTL)

    await this.sms.sendOtp(phone, code)

    return { message: fa.auth.otpSent }
  }

  async verifyOtp(rawPhone: string, code: string) {
    const phone = normalizePhone(rawPhone)
    const isTestPhone = phone === TEST_PHONE && this.isTestUserEnabled()

    if (isTestPhone) {
      if (code !== TEST_OTP_CODE) throw new UnauthorizedException(fa.auth.otpInvalid)
    } else {
      // attempt limit: 5 / 30min
      const attemptKey = otpAttemptKey(phone)
      const attempts = await this.redis.incr(attemptKey)
      if (attempts === 1) await this.redis.expire(attemptKey, OTP_ATTEMPT_WINDOW)
      if (attempts > OTP_ATTEMPT_LIMIT) {
        throw new HttpException(fa.auth.otpTooManyAttempts, 429)
      }

      const stored = await this.redis.get(otpKey(phone))
      if (!stored) throw new UnauthorizedException(fa.auth.otpExpired)
      if (stored !== code) throw new UnauthorizedException(fa.auth.otpInvalid)

      // clear otp + counters after success
      await this.redis.del(otpKey(phone), otpRateKey(phone), attemptKey)
    }

    // upsert نمی‌تواند بگوید رکورد جدید ساخته شد یا از قبل بود — برای گیت کمپین
    // سافت‌لانچ (فقط روی اولین ثبت‌نام) باید صریح جدا شود
    const existing = await this.prisma.user.findUnique({ where: { phone } })
    const user = existing ?? (await this.prisma.user.create({
      data: { phone, ...(isTestPhone ? { name: TEST_USER_NAME } : {}) },
    }))
    const isNewUser = !existing

    if (!user.isActive) throw new UnauthorizedException(fa.auth.userDisabled)

    // حساب تستی هیچ‌وقت پشت گیت waitlist سافت‌لانچ گیر نمی‌افتد
    let waitlisted: { message: string; queuePosition: number } | null = null
    if (isNewUser && !isTestPhone) {
      waitlisted = await this.campaign.applyToNewUser(user.id, user.phone)
    }

    const tokens = await this.issueTokens(user.id, user.phone, user.role)
    return {
      ...tokens,
      user: { id: user.id, phone: user.phone, role: user.role, name: user.name },
      waitlisted,
    }
  }

  async refresh(rawToken: string) {
    const hash = crypto.createHash('sha256').update(rawToken).digest('hex')
    const stored = await this.prisma.refreshToken.findUnique({
      where: { tokenHash: hash },
      include: { user: true },
    })

    if (!stored || stored.revokedAt || stored.expiresAt < new Date()) {
      throw new UnauthorizedException(fa.auth.refreshTokenInvalid)
    }
    if (!stored.user.isActive) throw new UnauthorizedException(fa.auth.userDisabled)

    // rotate: revoke old, issue new
    await this.prisma.refreshToken.update({
      where: { id: stored.id },
      data: { revokedAt: new Date() },
    })

    return this.issueTokens(stored.user.id, stored.user.phone, stored.user.role)
  }

  async logout(rawToken: string) {
    const hash = crypto.createHash('sha256').update(rawToken).digest('hex')
    await this.prisma.refreshToken.updateMany({
      where: { tokenHash: hash },
      data: { revokedAt: new Date() },
    })
  }

  async getMe(userId: string) {
    return this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        phone: true,
        name: true,
        role: true,
        createdAt: true,
        subscription: {
          select: {
            status: true,
            periodEnd: true,
            plan: { select: { name: true, dailyFreeTokens: true, monthlyTotalTokens: true, allowedModels: true } },
          },
        },
      },
    })
  }

  private async issueTokens(userId: string, phone: string, role: string) {
    const payload = { sub: userId, phone, role }

    const accessToken = this.jwt.sign(payload, {
      secret: this.config.get('JWT_SECRET'),
      expiresIn: this.config.get('JWT_EXPIRES_IN'),
    })

    const refreshToken = crypto.randomBytes(40).toString('hex')
    const hash = crypto.createHash('sha256').update(refreshToken).digest('hex')

    const expiresAt = new Date()
    expiresAt.setDate(expiresAt.getDate() + 30)

    await this.prisma.refreshToken.create({
      data: { userId, tokenHash: hash, expiresAt },
    })

    return { accessToken, refreshToken }
  }
}
