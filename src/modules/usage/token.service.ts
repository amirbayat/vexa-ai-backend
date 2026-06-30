import { HttpException, Injectable } from '@nestjs/common'
import { RedisService } from '../../redis/redis.service'
import { PrismaService } from '../../prisma/prisma.service'
import { fa } from '../../i18n/fa'

export interface TokenCheckResult {
  allowed: boolean
  source: 'free' | 'paid'
  remaining: number
}

interface PlanLimits {
  dailyFreeTokens: number
  monthlyTotalTokens: number
  allowedModels: string[]
}

function todayKey(userId: string) {
  const d = new Date().toISOString().slice(0, 10)
  return `token:free:${userId}:${d}`
}

function monthKey(userId: string) {
  const m = new Date().toISOString().slice(0, 7)
  return `token:paid:${userId}:${m}`
}

function planCacheKey(userId: string) {
  return `plan:${userId}`
}

@Injectable()
export class TokenService {
  constructor(
    private readonly redis: RedisService,
    private readonly prisma: PrismaService,
  ) {}

  async checkQuota(userId: string, estimated = 500): Promise<TokenCheckResult> {
    const plan = await this.getCachedPlan(userId)

    const [freeUsed, paidUsed] = await Promise.all([
      this.redis.get(todayKey(userId)).then(v => Number(v) || 0),
      this.redis.get(monthKey(userId)).then(v => Number(v) || 0),
    ])

    const freeRemaining = plan.dailyFreeTokens - freeUsed
    if (freeRemaining >= estimated) {
      return { allowed: true, source: 'free', remaining: freeRemaining }
    }

    const paidRemaining = plan.monthlyTotalTokens - paidUsed
    if (paidRemaining >= estimated) {
      return { allowed: true, source: 'paid', remaining: paidRemaining }
    }

    throw new HttpException(fa.chat.quotaExceeded, 429)
  }

  async increment(userId: string, tokens: number, source: 'free' | 'paid') {
    if (source === 'free') {
      const key = todayKey(userId)
      await this.redis.incrby(key, tokens)
      await this.redis.expire(key, 90_000, 'NX') // 25h
    } else {
      const key = monthKey(userId)
      await this.redis.incrby(key, tokens)
      await this.redis.expire(key, 2_764_800, 'NX') // 32d
    }
  }

  async getUsageToday(userId: string) {
    const plan = await this.getCachedPlan(userId)
    const [freeUsed, paidUsed] = await Promise.all([
      this.redis.get(todayKey(userId)).then(v => Number(v) || 0),
      this.redis.get(monthKey(userId)).then(v => Number(v) || 0),
    ])
    return {
      freeUsed,
      freeLimit: plan.dailyFreeTokens,
      paidUsed,
      paidLimit: plan.monthlyTotalTokens,
    }
  }

  async getUsageHistory(userId: string, month?: string) {
    const target = month ?? new Date().toISOString().slice(0, 7)
    const [year, mon] = target.split('-').map(Number)
    const start = new Date(year, mon - 1, 1)
    const end = new Date(year, mon, 1)

    const records = await this.prisma.dailyUsage.findMany({
      where: { userId, date: { gte: start, lt: end } },
      orderBy: { date: 'asc' },
      select: { date: true, freeTokensUsed: true, paidTokensUsed: true, requestsCount: true },
    })

    return records.map(r => ({
      date: r.date.toISOString().slice(0, 10),
      freeTokensUsed: r.freeTokensUsed,
      paidTokensUsed: r.paidTokensUsed,
      requestsCount: r.requestsCount,
    }))
  }

  async invalidatePlanCache(userId: string) {
    await this.redis.del(planCacheKey(userId))
  }

  async getCachedPlan(userId: string): Promise<PlanLimits> {
    const cached = await this.redis.get(planCacheKey(userId))
    if (cached) return JSON.parse(cached) as PlanLimits

    const sub = await this.prisma.subscription.findUnique({
      where: { userId },
      include: { plan: true },
    })

    // Fall back to free plan limits if no subscription
    const limits: PlanLimits = sub?.plan
      ? {
          dailyFreeTokens: sub.plan.dailyFreeTokens,
          monthlyTotalTokens: sub.plan.monthlyTotalTokens,
          allowedModels: sub.plan.allowedModels as string[],
        }
      : { dailyFreeTokens: 5000, monthlyTotalTokens: 0, allowedModels: ['gpt-4o-mini'] }

    await this.redis.set(planCacheKey(userId), JSON.stringify(limits), 'EX', 3600)
    return limits
  }
}
