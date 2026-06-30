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
exports.AdminService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../../prisma/prisma.service");
const fa_1 = require("../../i18n/fa");
let AdminService = class AdminService {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    async getDashboard() {
        const now = new Date();
        const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
        const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        const [totalUsers, activeUsers, revenueAll, revenueMrr, totalConversations, todayConversations,] = await Promise.all([
            this.prisma.user.count(),
            this.prisma.user.count({
                where: { conversations: { some: { lastMessageAt: { gte: thirtyDaysAgo } } } },
            }),
            this.prisma.payment.aggregate({
                where: { status: 'COMPLETED' },
                _sum: { amount: true },
            }),
            this.prisma.payment.aggregate({
                where: { status: 'COMPLETED', createdAt: { gte: startOfMonth } },
                _sum: { amount: true },
            }),
            this.prisma.conversation.count(),
            this.prisma.conversation.count({ where: { createdAt: { gte: startOfToday } } }),
        ]);
        return {
            totalUsers,
            activeUsers,
            totalRevenue: revenueAll._sum.amount ?? 0,
            mrr: revenueMrr._sum.amount ?? 0,
            totalConversations,
            todayConversations,
        };
    }
    async getUsers(page, limit, search) {
        const skip = (page - 1) * limit;
        const where = search
            ? { phone: { contains: search } }
            : {};
        const [users, total] = await Promise.all([
            this.prisma.user.findMany({
                where,
                skip,
                take: limit,
                orderBy: { createdAt: 'desc' },
                select: {
                    id: true,
                    phone: true,
                    name: true,
                    role: true,
                    isActive: true,
                    createdAt: true,
                    subscription: {
                        select: {
                            status: true,
                            periodEnd: true,
                            plan: { select: { name: true } },
                        },
                    },
                },
            }),
            this.prisma.user.count({ where }),
        ]);
        return { users, total, page, limit };
    }
    async updateUser(userId, data) {
        const user = await this.prisma.user.findUnique({ where: { id: userId } });
        if (!user)
            throw new common_1.NotFoundException(fa_1.fa.admin.userNotFound);
        const updated = await this.prisma.user.update({
            where: { id: userId },
            data,
            select: { id: true, phone: true, name: true, role: true, isActive: true },
        });
        return { message: fa_1.fa.admin.userUpdated, user: updated };
    }
    async getTokenStats() {
        const now = new Date();
        const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
        const [todayStats, monthStats] = await Promise.all([
            this.prisma.dailyUsage.aggregate({
                where: { date: { gte: startOfToday } },
                _sum: { freeTokensUsed: true, paidTokensUsed: true, requestsCount: true },
            }),
            this.prisma.dailyUsage.aggregate({
                where: { date: { gte: startOfMonth } },
                _sum: { freeTokensUsed: true, paidTokensUsed: true },
            }),
        ]);
        return {
            today: {
                totalFree: todayStats._sum.freeTokensUsed ?? 0,
                totalPaid: todayStats._sum.paidTokensUsed ?? 0,
                requests: todayStats._sum.requestsCount ?? 0,
            },
            thisMonth: {
                totalFree: monthStats._sum.freeTokensUsed ?? 0,
                totalPaid: monthStats._sum.paidTokensUsed ?? 0,
            },
        };
    }
    async getRevenueStats() {
        const rows = await this.prisma.$queryRaw `
      SELECT
        TO_CHAR(DATE_TRUNC('month', "createdAt"), 'YYYY-MM') AS month,
        SUM(amount)::bigint AS revenue,
        COUNT(*)::bigint AS count
      FROM payments
      WHERE status = 'COMPLETED'
        AND "createdAt" >= NOW() - INTERVAL '12 months'
      GROUP BY DATE_TRUNC('month', "createdAt")
      ORDER BY DATE_TRUNC('month', "createdAt") ASC
    `;
        return rows.map(r => ({
            month: r.month,
            revenue: Number(r.revenue),
            count: Number(r.count),
        }));
    }
};
exports.AdminService = AdminService;
exports.AdminService = AdminService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], AdminService);
//# sourceMappingURL=admin.service.js.map