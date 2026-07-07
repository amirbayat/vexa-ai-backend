"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.UsageAnalyticsService = void 0;
exports.parseDateRange = parseDateRange;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../../prisma/prisma.service");
function parseDateRange(from, to) {
    const toDate = to ? new Date(to) : new Date();
    const fromDate = from
        ? new Date(from)
        : new Date(toDate.getTime() - 29 * 86_400_000);
    toDate.setHours(23, 59, 59, 999);
    return { from: fromDate, to: toDate };
}
function previousPeriod(range) {
    const lengthMs = range.to.getTime() - range.from.getTime();
    return {
        from: new Date(range.from.getTime() - lengthMs - 1),
        to: new Date(range.from.getTime() - 1),
    };
}
function daysBetweenInclusive(from, to) {
    return Math.max(1, Math.floor((to.getTime() - from.getTime()) / 86_400_000) + 1);
}
function pctChange(current, previous) {
    if (previous === 0)
        return current === 0 ? 0 : null;
    return (current - previous) / previous;
}
function percentile(sortedAsc, p) {
    if (!sortedAsc.length)
        return 0;
    const idx = (p / 100) * (sortedAsc.length - 1);
    const lo = Math.floor(idx);
    const hi = Math.ceil(idx);
    if (lo === hi)
        return sortedAsc[lo];
    return sortedAsc[lo] + (sortedAsc[hi] - sortedAsc[lo]) * (idx - lo);
}
function csvEscape(v) {
    const s = String(v ?? '');
    return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}
let UsageAnalyticsService = class UsageAnalyticsService {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    async getOverview(range, compare) {
        const current = await this.computeOverview(range);
        if (!compare)
            return { current, previous: null };
        const previous = await this.computeOverview(previousPeriod(range));
        return {
            current,
            previous,
            growth: {
                totalTokens: pctChange(current.totalTokens, previous.totalTokens),
                totalMessages: pctChange(current.totalMessages, previous.totalMessages),
                costRial: pctChange(current.costRial, previous.costRial),
                revenueRial: pctChange(current.revenueRial, previous.revenueRial),
            },
        };
    }
    async computeOverview(range) {
        const [usage, revenue, modelBreakdown] = await Promise.all([
            this.prisma.dailyUsage.aggregate({
                where: { date: { gte: range.from, lte: range.to } },
                _sum: {
                    freeTokensUsed: true,
                    paidTokensUsed: true,
                    requestsCount: true,
                    costRial: true,
                    costUsdMicros: true,
                },
            }),
            this.prisma.payment.aggregate({
                where: { status: 'COMPLETED', createdAt: { gte: range.from, lte: range.to } },
                _sum: { amount: true },
            }),
            this.getModelBreakdown(range),
        ]);
        const totalTokens = (usage._sum.freeTokensUsed ?? 0) + (usage._sum.paidTokensUsed ?? 0);
        const totalMessages = usage._sum.requestsCount ?? 0;
        const costRial = usage._sum.costRial ?? 0;
        const revenueRial = revenue._sum.amount ?? 0;
        return {
            totalTokens,
            totalMessages,
            costRial,
            costUsd: (usage._sum.costUsdMicros ?? 0) / 1_000_000,
            revenueRial,
            marginRial: revenueRial - costRial,
            marginPct: revenueRial > 0 ? (revenueRial - costRial) / revenueRial : null,
            avgTokensPerMessage: totalMessages > 0 ? Math.round(totalTokens / totalMessages) : 0,
            topModel: modelBreakdown[0]?.model ?? null,
        };
    }
    async getTimeseries(range, granularity) {
        const rows = await this.prisma.dailyUsage.groupBy({
            by: ['date'],
            where: { date: { gte: range.from, lte: range.to } },
            _sum: {
                freeTokensUsed: true,
                paidTokensUsed: true,
                requestsCount: true,
                costRial: true,
                costUsdMicros: true,
            },
            orderBy: { date: 'asc' },
        });
        const points = rows.map((r) => ({
            date: r.date.toISOString().slice(0, 10),
            tokens: (r._sum.freeTokensUsed ?? 0) + (r._sum.paidTokensUsed ?? 0),
            messages: r._sum.requestsCount ?? 0,
            costRial: r._sum.costRial ?? 0,
            costUsd: (r._sum.costUsdMicros ?? 0) / 1_000_000,
        }));
        if (granularity === 'day')
            return points;
        const buckets = new Map();
        for (const p of points) {
            const key = granularity === 'month' ? p.date.slice(0, 7) : isoWeekKey(p.date);
            const b = buckets.get(key) ?? { tokens: 0, messages: 0, costRial: 0, costUsd: 0 };
            b.tokens += p.tokens;
            b.messages += p.messages;
            b.costRial += p.costRial;
            b.costUsd += p.costUsd;
            buckets.set(key, b);
        }
        return Array.from(buckets.entries())
            .map(([period, v]) => ({ period, ...v }))
            .sort((a, b) => a.period.localeCompare(b.period));
    }
    async getModelBreakdown(range) {
        const rows = await this.prisma.message.groupBy({
            by: ['model'],
            where: { role: 'ASSISTANT', model: { not: null }, createdAt: { gte: range.from, lte: range.to } },
            _sum: { tokensInput: true, tokensOutput: true, costRial: true, costUsdMicros: true },
            _count: { id: true },
        });
        return rows
            .map((r) => ({
            model: r.model,
            messages: r._count.id,
            tokensInput: r._sum.tokensInput ?? 0,
            tokensOutput: r._sum.tokensOutput ?? 0,
            costRial: r._sum.costRial ?? 0,
            costUsd: (r._sum.costUsdMicros ?? 0) / 1_000_000,
        }))
            .sort((a, b) => b.costRial - a.costRial);
    }
    async getTopicBreakdown(range) {
        const [rows, untagged, topics] = await Promise.all([
            this.prisma.message.groupBy({
                by: ['topicId'],
                where: { role: 'USER', topicId: { not: null }, createdAt: { gte: range.from, lte: range.to } },
                _count: { id: true },
            }),
            this.prisma.message.count({
                where: { role: 'USER', topicId: null, createdAt: { gte: range.from, lte: range.to } },
            }),
            this.prisma.topic.findMany({ select: { id: true, name: true, color: true } }),
        ]);
        const topicMap = new Map(topics.map((t) => [t.id, t]));
        const total = rows.reduce((s, r) => s + r._count.id, 0) + untagged;
        const result = rows.map((r) => {
            const topic = topicMap.get(r.topicId);
            return {
                topicId: r.topicId,
                name: topic?.name ?? 'نامشخص',
                color: topic?.color ?? null,
                messages: r._count.id,
                pct: total > 0 ? r._count.id / total : 0,
            };
        });
        if (untagged > 0) {
            result.push({
                topicId: null,
                name: 'نامشخص',
                color: null,
                messages: untagged,
                pct: total > 0 ? untagged / total : 0,
            });
        }
        return result.sort((a, b) => b.messages - a.messages);
    }
    async getLimitHits(range) {
        const [byType, uniqueUsers] = await Promise.all([
            this.prisma.limitHitEvent.groupBy({
                by: ['type'],
                where: { date: { gte: range.from, lte: range.to } },
                _count: { id: true },
            }),
            this.prisma.limitHitEvent.findMany({
                where: { date: { gte: range.from, lte: range.to } },
                select: { userId: true },
                distinct: ['userId'],
            }),
        ]);
        return {
            byType: byType.map((r) => ({ type: r.type, count: r._count.id })),
            uniqueUsers: uniqueUsers.length,
        };
    }
    async logLimitHit(userId, type) {
        try {
            const today = new Date(new Date().toISOString().slice(0, 10));
            await this.prisma.limitHitEvent.create({ data: { userId, type, date: today } });
        }
        catch {
        }
    }
    async getUsers(range, segmentLabel) {
        const days = daysBetweenInclusive(range.from, range.to);
        const [perUserModel, revenueRows, segments] = await Promise.all([
            this.prisma.message.groupBy({
                by: ['userId', 'model'],
                where: { role: 'ASSISTANT', userId: { not: null }, createdAt: { gte: range.from, lte: range.to } },
                _sum: { tokensInput: true, tokensOutput: true, costRial: true, costUsdMicros: true },
                _count: { id: true },
            }),
            this.prisma.payment.groupBy({
                by: ['userId'],
                where: { status: 'COMPLETED', createdAt: { gte: range.from, lte: range.to } },
                _sum: { amount: true },
            }),
            this.listSegments(),
        ]);
        const byUser = new Map();
        for (const row of perUserModel) {
            const uid = row.userId;
            const agg = byUser.get(uid) ?? {
                messages: 0,
                tokensInput: 0,
                tokensOutput: 0,
                costRial: 0,
                costUsdMicros: 0,
                modelCounts: new Map(),
            };
            agg.messages += row._count.id;
            agg.tokensInput += row._sum.tokensInput ?? 0;
            agg.tokensOutput += row._sum.tokensOutput ?? 0;
            agg.costRial += row._sum.costRial ?? 0;
            agg.costUsdMicros += row._sum.costUsdMicros ?? 0;
            if (row.model)
                agg.modelCounts.set(row.model, (agg.modelCounts.get(row.model) ?? 0) + row._count.id);
            byUser.set(uid, agg);
        }
        const revenueMap = new Map(revenueRows.map((r) => [r.userId, r._sum.amount ?? 0]));
        const userIds = Array.from(byUser.keys());
        const users = userIds.length
            ? await this.prisma.user.findMany({
                where: { id: { in: userIds } },
                select: { id: true, phone: true, name: true },
            })
            : [];
        const userMap = new Map(users.map((u) => [u.id, u]));
        let results = userIds.map((userId) => {
            const agg = byUser.get(userId);
            const revenueRial = revenueMap.get(userId) ?? 0;
            const avgMessagesPerDay = agg.messages / days;
            const avgTokensPerDay = (agg.tokensInput + agg.tokensOutput) / days;
            const segment = this.matchSegment(segments, avgMessagesPerDay, avgTokensPerDay);
            const mostUsedModel = [...agg.modelCounts.entries()].sort((a, b) => b[1] - a[1])[0]?.[0] ?? null;
            const user = userMap.get(userId);
            return {
                userId,
                phone: user?.phone ?? null,
                name: user?.name ?? null,
                messages: agg.messages,
                avgMessagesPerDay,
                tokensInput: agg.tokensInput,
                tokensOutput: agg.tokensOutput,
                avgTokensPerDay,
                costRial: agg.costRial,
                costUsd: agg.costUsdMicros / 1_000_000,
                revenueRial,
                marginRial: revenueRial - agg.costRial,
                mostUsedModel,
                segment: segment?.label ?? null,
            };
        });
        if (segmentLabel)
            results = results.filter((r) => r.segment === segmentLabel);
        return results.sort((a, b) => b.costRial - a.costRial);
    }
    async exportUsersCsv(range, segmentLabel) {
        const users = await this.getUsers(range, segmentLabel);
        const header = [
            'شماره موبایل', 'نام', 'تعداد پیام', 'میانگین پیام روزانه',
            'توکن ورودی', 'توکن خروجی', 'هزینه (تومان)', 'هزینه (دلار)',
            'درآمد (تومان)', 'حاشیه سود (تومان)', 'پرمصرف‌ترین مدل', 'دسته',
        ];
        const lines = [header.join(',')];
        for (const u of users) {
            lines.push([
                u.phone, u.name, u.messages, u.avgMessagesPerDay.toFixed(1),
                u.tokensInput, u.tokensOutput, u.costRial, u.costUsd.toFixed(4),
                u.revenueRial, u.marginRial, u.mostUsedModel, u.segment,
            ]
                .map(csvEscape)
                .join(','));
        }
        return lines.join('\n');
    }
    async getSegmentBreakdown(range, compare) {
        const current = await this.computeSegmentBreakdown(range);
        if (!compare)
            return { current, previous: null };
        const previous = await this.computeSegmentBreakdown(previousPeriod(range));
        return { current, previous };
    }
    async computeSegmentBreakdown(range) {
        const users = await this.getUsers(range);
        const groups = new Map();
        for (const u of users) {
            const key = u.segment ?? 'بدون دسته';
            if (!groups.has(key))
                groups.set(key, []);
            groups.get(key).push(u);
        }
        return Array.from(groups.entries()).map(([label, group]) => {
            const msgValues = group.map((g) => g.avgMessagesPerDay).sort((a, b) => a - b);
            const tokenValues = group.map((g) => g.avgTokensPerDay).sort((a, b) => a - b);
            const costRial = group.reduce((s, g) => s + g.costRial, 0);
            const revenueRial = group.reduce((s, g) => s + g.revenueRial, 0);
            return {
                label,
                userCount: group.length,
                avgMessagesPerDay: msgValues.reduce((s, v) => s + v, 0) / group.length,
                medianMessagesPerDay: percentile(msgValues, 50),
                p90MessagesPerDay: percentile(msgValues, 90),
                avgTokensPerDay: tokenValues.reduce((s, v) => s + v, 0) / group.length,
                medianTokensPerDay: percentile(tokenValues, 50),
                p90TokensPerDay: percentile(tokenValues, 90),
                costRial,
                revenueRial,
                marginRial: revenueRial - costRial,
                marginPct: revenueRial > 0 ? (revenueRial - costRial) / revenueRial : null,
            };
        });
    }
    matchSegment(segments, avgMessagesPerDay, avgTokensPerDay) {
        for (const s of segments) {
            if (s.minMessagesPerDay != null && avgMessagesPerDay < s.minMessagesPerDay)
                continue;
            if (s.maxMessagesPerDay != null && avgMessagesPerDay > s.maxMessagesPerDay)
                continue;
            if (s.minTokensPerDay != null && avgTokensPerDay < s.minTokensPerDay)
                continue;
            if (s.maxTokensPerDay != null && avgTokensPerDay > s.maxTokensPerDay)
                continue;
            return s;
        }
        return null;
    }
    async listSegments() {
        return this.prisma.userSegment.findMany({ orderBy: { sortOrder: 'asc' } });
    }
    async createSegment(data) {
        return this.prisma.userSegment.create({ data });
    }
    async updateSegment(id, data) {
        return this.prisma.userSegment.update({ where: { id }, data });
    }
    async deleteSegment(id) {
        return this.prisma.userSegment.delete({ where: { id } });
    }
};
exports.UsageAnalyticsService = UsageAnalyticsService;
exports.UsageAnalyticsService = UsageAnalyticsService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], UsageAnalyticsService);
function isoWeekKey(dateStr) {
    const d = new Date(dateStr);
    d.setHours(0, 0, 0, 0);
    d.setDate(d.getDate() + 3 - ((d.getDay() + 6) % 7));
    const week1 = new Date(d.getFullYear(), 0, 4);
    const weekNo = 1 + Math.round(((d.getTime() - week1.getTime()) / 86_400_000 - 3 + ((week1.getDay() + 6) % 7)) / 7);
    return `${d.getFullYear()}-W${String(weekNo).padStart(2, '0')}`;
}
//# sourceMappingURL=usage-analytics.service.js.map