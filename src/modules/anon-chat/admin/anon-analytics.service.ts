import { Injectable } from '@nestjs/common'
import { PrismaService } from '../../../prisma/prisma.service'
import type { AnonFunnelEventType } from '@prisma/client'

// ترتیب دقیق فانل — از بازدید تا اولین خرید. دو مرحله‌ی آخر عمداً event ذخیره‌شده ندارند:
// به‌جایش با join مستقیم روی Message/Payment (که همان مسیر production کاربران واقعی پر
// می‌کند) محاسبه می‌شوند — یعنی هیچ hook جدیدی داخل chat.service.ts/payments.service.ts
// لازم نبود، صفر تغییر در آن فایل‌های production.
const FUNNEL_STAGES: { key: AnonFunnelEventType | 'FIRST_MESSAGE_AFTER_SIGNUP' | 'FIRST_PURCHASE'; label: string }[] = [
  { key: 'SESSION_CREATED', label: 'بازدید' },
  { key: 'FIRST_MESSAGE_SENT', label: 'اولین پیام' },
  { key: 'ENTERED_LIMITED_ZONE', label: 'ورود به ناحیه‌ی محدود' },
  { key: 'HARD_BLOCKED', label: 'مسدود شده' },
  { key: 'CLICKED_SIGNUP_CTA', label: 'کلیک روی ثبت‌نام' },
  { key: 'SIGNUP_COMPLETED', label: 'ثبت‌نام کامل' },
  { key: 'FIRST_MESSAGE_AFTER_SIGNUP', label: 'اولین پیام بعد از ثبت‌نام' },
  { key: 'FIRST_PURCHASE', label: 'اولین خرید' },
]

interface UtmFilter {
  utmSource?: string
  utmCampaign?: string
}

@Injectable()
export class AnonAnalyticsService {
  constructor(private readonly prisma: PrismaService) {}

  async overview(from: Date, to: Date) {
    const [totalIdentities, totalSessions, totalMessages, convertedSessions] = await Promise.all([
      this.prisma.anonymousIdentity.count({ where: { firstSeenAt: { gte: from, lte: to } } }),
      this.prisma.anonymousSession.count({ where: { createdAt: { gte: from, lte: to } } }),
      this.prisma.anonymousMessage.count({
        where: { role: 'USER', createdAt: { gte: from, lte: to } },
      }),
      this.prisma.anonymousSession.count({
        where: { createdAt: { gte: from, lte: to }, migratedToUserId: { not: null } },
      }),
    ])

    return {
      totalIdentities,
      totalSessions,
      totalMessages,
      convertedSessions,
      conversionRate: totalSessions > 0 ? convertedSessions / totalSessions : 0,
      avgMessagesPerSession: totalSessions > 0 ? totalMessages / totalSessions : 0,
    }
  }

  async timeseries(from: Date, to: Date) {
    const [sessionRows, messageRows] = await Promise.all([
      this.prisma.$queryRaw<Array<{ day: Date; count: bigint }>>`
        SELECT DATE_TRUNC('day', "createdAt") AS day, COUNT(*)::bigint AS count
        FROM anonymous_sessions
        WHERE "createdAt" BETWEEN ${from} AND ${to}
        GROUP BY DATE_TRUNC('day', "createdAt")
        ORDER BY day ASC
      `,
      this.prisma.$queryRaw<Array<{ day: Date; count: bigint }>>`
        SELECT DATE_TRUNC('day', "createdAt") AS day, COUNT(*)::bigint AS count
        FROM anonymous_messages
        WHERE role = 'USER' AND "createdAt" BETWEEN ${from} AND ${to}
        GROUP BY DATE_TRUNC('day', "createdAt")
        ORDER BY day ASC
      `,
    ])

    const messageMap = new Map(messageRows.map((r) => [r.day.toISOString().slice(0, 10), Number(r.count)]))
    return sessionRows.map((r) => {
      const day = r.day.toISOString().slice(0, 10)
      return { day, sessions: Number(r.count), messages: messageMap.get(day) ?? 0 }
    })
  }

  async sessions(from: Date, to: Date, page: number, pageSize: number, filter: UtmFilter) {
    const where = {
      createdAt: { gte: from, lte: to },
      ...(filter.utmSource ? { utmSource: filter.utmSource } : {}),
      ...(filter.utmCampaign ? { utmCampaign: filter.utmCampaign } : {}),
    }
    const [rows, total] = await Promise.all([
      this.prisma.anonymousSession.findMany({
        where,
        include: {
          identity: { select: { ip: true, lifetimeMessageCount: true } },
          conversations: { select: { id: true, title: true, createdAt: true, lastMessageAt: true } },
        },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      this.prisma.anonymousSession.count({ where }),
    ])
    return { rows, total, page, pageSize }
  }

  async getSessionConversationMessages(conversationId: string) {
    return this.prisma.anonymousMessage.findMany({
      where: { conversationId },
      orderBy: { createdAt: 'asc' },
    })
  }

  async funnel(from: Date, to: Date, filter: UtmFilter) {
    const eventStages = FUNNEL_STAGES.filter((s) => s.key !== 'FIRST_MESSAGE_AFTER_SIGNUP' && s.key !== 'FIRST_PURCHASE')
    const eventCounts = await Promise.all(
      eventStages.map((stage) =>
        this.prisma.anonymousFunnelEvent.count({
          where: {
            eventType: stage.key as AnonFunnelEventType,
            createdAt: { gte: from, lte: to },
            session: {
              ...(filter.utmSource ? { utmSource: filter.utmSource } : {}),
              ...(filter.utmCampaign ? { utmCampaign: filter.utmCampaign } : {}),
            },
          },
        }),
      ),
    )

    const [firstMessageAfterSignup] = await this.prisma.$queryRaw<Array<{ count: bigint }>>`
      SELECT COUNT(DISTINCT s.id)::bigint AS count
      FROM anonymous_sessions s
      JOIN messages m ON m."userId" = s."migratedToUserId" AND m.role = 'USER' AND m."createdAt" > s."migratedAt"
      WHERE s."migratedToUserId" IS NOT NULL
        AND s."createdAt" BETWEEN ${from} AND ${to}
        AND (${filter.utmSource ?? null}::text IS NULL OR s."utmSource" = ${filter.utmSource ?? null})
        AND (${filter.utmCampaign ?? null}::text IS NULL OR s."utmCampaign" = ${filter.utmCampaign ?? null})
    `
    const [firstPurchase] = await this.prisma.$queryRaw<Array<{ count: bigint }>>`
      SELECT COUNT(DISTINCT s.id)::bigint AS count
      FROM anonymous_sessions s
      JOIN payments p ON p."userId" = s."migratedToUserId" AND p.status = 'COMPLETED'
      WHERE s."migratedToUserId" IS NOT NULL
        AND s."createdAt" BETWEEN ${from} AND ${to}
        AND (${filter.utmSource ?? null}::text IS NULL OR s."utmSource" = ${filter.utmSource ?? null})
        AND (${filter.utmCampaign ?? null}::text IS NULL OR s."utmCampaign" = ${filter.utmCampaign ?? null})
    `

    const counts = [...eventCounts, Number(firstMessageAfterSignup.count), Number(firstPurchase.count)]
    return FUNNEL_STAGES.map((stage, i) => ({
      key: stage.key,
      label: stage.label,
      count: counts[i],
      dropOffPct: i === 0 || counts[i - 1] === 0 ? 0 : Math.round((1 - counts[i] / counts[i - 1]) * 1000) / 10,
    }))
  }

  async campaigns(from: Date, to: Date) {
    const sessionRows = await this.prisma.anonymousSession.findMany({
      where: { createdAt: { gte: from, lte: to } },
      select: { id: true, utmSource: true, utmCampaign: true, migratedToUserId: true },
    })
    if (sessionRows.length === 0) return []

    const sessionIds = sessionRows.map((s) => s.id)
    const userIds = sessionRows.map((s) => s.migratedToUserId).filter((id): id is string => id !== null)

    const [msgCountRows, payments] = await Promise.all([
      this.prisma.$queryRaw<Array<{ sessionId: string; count: bigint }>>`
        SELECT ac."sessionId" AS "sessionId", COUNT(*)::bigint AS count
        FROM anonymous_messages am
        JOIN anonymous_conversations ac ON ac.id = am."conversationId"
        WHERE am.role = 'USER' AND ac."sessionId" = ANY(${sessionIds}::text[])
        GROUP BY ac."sessionId"
      `,
      userIds.length
        ? this.prisma.payment.findMany({
            where: { userId: { in: userIds }, status: 'COMPLETED' },
            select: { userId: true, amount: true },
          })
        : Promise.resolve([]),
    ])

    const msgCountMap = new Map(msgCountRows.map((r) => [r.sessionId, Number(r.count)]))
    const paidUserIds = new Set(payments.map((p) => p.userId))
    const revenueByUser = new Map<string, number>()
    for (const p of payments) revenueByUser.set(p.userId, (revenueByUser.get(p.userId) ?? 0) + p.amount)

    const groups = new Map<
      string,
      { utmSource: string | null; utmCampaign: string | null; sessions: number; messages: number; signups: number; purchases: number; revenue: number }
    >()
    for (const s of sessionRows) {
      const key = `${s.utmSource ?? ''} ${s.utmCampaign ?? ''}`
      const g = groups.get(key) ?? {
        utmSource: s.utmSource,
        utmCampaign: s.utmCampaign,
        sessions: 0,
        messages: 0,
        signups: 0,
        purchases: 0,
        revenue: 0,
      }
      g.sessions += 1
      g.messages += msgCountMap.get(s.id) ?? 0
      if (s.migratedToUserId) {
        g.signups += 1
        if (paidUserIds.has(s.migratedToUserId)) {
          g.purchases += 1
          g.revenue += revenueByUser.get(s.migratedToUserId) ?? 0
        }
      }
      groups.set(key, g)
    }

    return Array.from(groups.values())
      .map((g) => ({ ...g, conversionRate: g.sessions > 0 ? g.purchases / g.sessions : 0 }))
      .sort((a, b) => b.sessions - a.sessions)
  }

  async conversionQuality(from: Date, to: Date) {
    const purchases = await this.prisma.$queryRaw<
      Array<{ sessionId: string; userId: string; firstSeenAt: Date; firstPurchaseAt: Date; amount: number }>
    >`
      SELECT s.id AS "sessionId", s."migratedToUserId" AS "userId", i."firstSeenAt" AS "firstSeenAt",
             first_pay."createdAt" AS "firstPurchaseAt", first_pay.amount AS amount
      FROM anonymous_sessions s
      JOIN anonymous_identities i ON i.id = s."identityId"
      JOIN LATERAL (
        SELECT p."createdAt", p.amount FROM payments p
        WHERE p."userId" = s."migratedToUserId" AND p.status = 'COMPLETED'
        ORDER BY p."createdAt" ASC LIMIT 1
      ) first_pay ON true
      WHERE s."migratedToUserId" IS NOT NULL AND s."createdAt" BETWEEN ${from} AND ${to}
    `

    if (purchases.length === 0) {
      return { sampleSize: 0, avgMessagesBeforePurchase: 0, avgDaysToPurchase: 0, avgRevenueToman: 0, histogram: [] as { bucket: string; count: number }[] }
    }

    const sessionIds = purchases.map((p) => p.sessionId)
    const anonCountRows = await this.prisma.$queryRaw<Array<{ sessionId: string; count: bigint }>>`
      SELECT ac."sessionId" AS "sessionId", COUNT(*)::bigint AS count
      FROM anonymous_messages am
      JOIN anonymous_conversations ac ON ac.id = am."conversationId"
      WHERE am.role = 'USER' AND ac."sessionId" = ANY(${sessionIds}::text[])
      GROUP BY ac."sessionId"
    `
    const anonCountMap = new Map(anonCountRows.map((r) => [r.sessionId, Number(r.count)]))

    // تعداد کوچک (فقط سشن‌هایی که واقعاً خرید کردند) — یک کوئری جدا به‌ازای هر کاربر خیلی
    // ساده‌تر از ساختن VALUES پویا در SQL است، بدون هزینه‌ی محسوس روی این مسیر ادمین
    const postSignupCounts = await Promise.all(
      purchases.map((p) =>
        this.prisma.message.count({
          where: { userId: p.userId, role: 'USER', createdAt: { lte: p.firstPurchaseAt } },
        }),
      ),
    )

    const totalMessages = purchases.map((p, i) => (anonCountMap.get(p.sessionId) ?? 0) + postSignupCounts[i])
    const daysToPurchase = purchases.map(
      (p) => (p.firstPurchaseAt.getTime() - p.firstSeenAt.getTime()) / (1000 * 60 * 60 * 24),
    )

    const bucketOf = (n: number) => {
      if (n <= 5) return '۱-۵'
      if (n <= 10) return '۶-۱۰'
      if (n <= 20) return '۱۱-۲۰'
      if (n <= 50) return '۲۱-۵۰'
      return '۵۰+'
    }
    const histogramMap = new Map<string, number>()
    for (const n of totalMessages) histogramMap.set(bucketOf(n), (histogramMap.get(bucketOf(n)) ?? 0) + 1)

    return {
      sampleSize: purchases.length,
      avgMessagesBeforePurchase: totalMessages.reduce((a, b) => a + b, 0) / purchases.length,
      avgDaysToPurchase: daysToPurchase.reduce((a, b) => a + b, 0) / purchases.length,
      avgRevenueToman: purchases.reduce((a, p) => a + p.amount, 0) / purchases.length,
      histogram: Array.from(histogramMap.entries()).map(([bucket, count]) => ({ bucket, count })),
    }
  }
}
