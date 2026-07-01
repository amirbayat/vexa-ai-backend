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
var TokenFlushProcessor_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.TokenFlushProcessor = void 0;
const bull_1 = require("@nestjs/bull");
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../../prisma/prisma.service");
const redis_service_1 = require("../../redis/redis.service");
let TokenFlushProcessor = TokenFlushProcessor_1 = class TokenFlushProcessor {
    redis;
    prisma;
    logger = new common_1.Logger(TokenFlushProcessor_1.name);
    constructor(redis, prisma) {
        this.redis = redis;
        this.prisma = prisma;
    }
    async handleFlush() {
        const today = new Date().toISOString().slice(0, 10);
        const date = new Date(today);
        const [freeKeys, dpKeys, reqKeys] = await Promise.all([
            this.scanKeys(`token:free:*:${today}`),
            this.scanKeys(`token:dailypaid:*:${today}`),
            this.scanKeys(`token:req:*:${today}`),
        ]);
        if (!freeKeys.length && !dpKeys.length && !reqKeys.length)
            return;
        const allKeys = [...freeKeys, ...dpKeys, ...reqKeys];
        const values = await Promise.all(allKeys.map(k => this.redis.get(k)));
        const userMap = new Map();
        const row = (id) => {
            if (!userMap.has(id))
                userMap.set(id, { freeTokensUsed: 0, paidTokensUsed: 0, requestsCount: 0 });
            return userMap.get(id);
        };
        freeKeys.forEach((k, i) => {
            row(k.split(':')[2]).freeTokensUsed = Number(values[i]) || 0;
        });
        dpKeys.forEach((k, i) => {
            row(k.split(':')[2]).paidTokensUsed = Number(values[freeKeys.length + i]) || 0;
        });
        reqKeys.forEach((k, i) => {
            row(k.split(':')[2]).requestsCount = Number(values[freeKeys.length + dpKeys.length + i]) || 0;
        });
        await Promise.all(Array.from(userMap.entries()).map(([userId, data]) => this.prisma.dailyUsage.upsert({
            where: { userId_date: { userId, date } },
            create: { userId, date, ...data },
            update: data,
        })));
        this.logger.log(`Token flush: synced ${userMap.size} users for ${today}`);
    }
    scanKeys(pattern) {
        return new Promise((resolve, reject) => {
            const keys = [];
            const stream = this.redis.scanStream({ match: pattern, count: 100 });
            stream.on('data', (batch) => keys.push(...batch));
            stream.on('end', () => resolve(keys));
            stream.on('error', reject);
        });
    }
};
exports.TokenFlushProcessor = TokenFlushProcessor;
__decorate([
    (0, bull_1.Process)('flush'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], TokenFlushProcessor.prototype, "handleFlush", null);
exports.TokenFlushProcessor = TokenFlushProcessor = TokenFlushProcessor_1 = __decorate([
    (0, bull_1.Processor)('token-flush'),
    __metadata("design:paramtypes", [redis_service_1.RedisService,
        prisma_service_1.PrismaService])
], TokenFlushProcessor);
//# sourceMappingURL=token-flush.processor.js.map