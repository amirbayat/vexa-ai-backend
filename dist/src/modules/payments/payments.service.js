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
exports.PaymentsService = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const prisma_service_1 = require("../../prisma/prisma.service");
const token_service_1 = require("../usage/token.service");
const zarinpal_service_1 = require("./zarinpal.service");
const fa_1 = require("../../i18n/fa");
const SUBSCRIPTION_DAYS = 30;
let PaymentsService = class PaymentsService {
    prisma;
    zarinpal;
    tokenService;
    config;
    constructor(prisma, zarinpal, tokenService, config) {
        this.prisma = prisma;
        this.zarinpal = zarinpal;
        this.tokenService = tokenService;
        this.config = config;
    }
    async initiate(userId, dto) {
        const plan = await this.prisma.plan.findUnique({ where: { id: dto.planId } });
        if (!plan)
            throw new common_1.NotFoundException(fa_1.fa.plans.notFound);
        if (!plan.isActive)
            throw new common_1.BadRequestException(fa_1.fa.plans.notActive);
        const callbackUrl = `${this.config.get('APP_URL')}/api/v1/payments/callback`;
        const { authority, paymentUrl } = await this.zarinpal.requestPayment(plan.priceMonthly, fa_1.fa.payment.description(plan.name), callbackUrl);
        await this.prisma.payment.create({
            data: { userId, planId: dto.planId, amount: plan.priceMonthly, authority },
        });
        return { paymentUrl, authority };
    }
    async verify(authority, status) {
        const appUrl = this.config.get('APP_URL');
        if (status !== 'OK') {
            const payment = await this.prisma.payment.findUnique({ where: { authority } });
            if (payment) {
                await this.prisma.payment.update({ where: { authority }, data: { status: 'FAILED' } });
            }
            return { redirect: `${appUrl}/payment?status=failed` };
        }
        const payment = await this.prisma.payment.findUnique({
            where: { authority },
            include: { plan: true },
        });
        if (!payment)
            throw new common_1.NotFoundException(fa_1.fa.payment.notFound);
        if (payment.status === 'COMPLETED') {
            return { redirect: `${appUrl}/payment?status=success&refId=${payment.refId}` };
        }
        if (payment.status !== 'PENDING')
            throw new common_1.BadRequestException(fa_1.fa.payment.invalidStatus);
        const { success, refId } = await this.zarinpal.verifyPayment(payment.amount, authority);
        if (!success) {
            await this.prisma.payment.update({ where: { authority }, data: { status: 'FAILED' } });
            return { redirect: `${appUrl}/payment?status=failed` };
        }
        const now = new Date();
        const periodEnd = new Date(now.getTime() + SUBSCRIPTION_DAYS * 24 * 60 * 60 * 1000);
        await this.prisma.$transaction(async (tx) => {
            await tx.payment.update({
                where: { authority },
                data: { status: 'COMPLETED', refId: refId },
            });
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
            });
        });
        await this.tokenService.invalidatePlanCache(payment.userId);
        return { redirect: `${appUrl}/payment?status=success&refId=${refId}` };
    }
    findAll(userId) {
        return this.prisma.payment.findMany({
            where: { userId },
            include: { plan: { select: { name: true } } },
            orderBy: { createdAt: 'desc' },
        });
    }
    getHistory(userId) {
        return this.prisma.payment.findMany({
            where: { userId },
            include: { plan: { select: { name: true } } },
            orderBy: { createdAt: 'desc' },
            take: 20,
        });
    }
};
exports.PaymentsService = PaymentsService;
exports.PaymentsService = PaymentsService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        zarinpal_service_1.ZarinpalService,
        token_service_1.TokenService,
        config_1.ConfigService])
], PaymentsService);
//# sourceMappingURL=payments.service.js.map