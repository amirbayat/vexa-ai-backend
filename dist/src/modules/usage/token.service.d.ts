import { RedisService } from '../../redis/redis.service';
import { PrismaService } from '../../prisma/prisma.service';
export interface TokenCheckResult {
    allowed: boolean;
    source: 'free' | 'paid';
    remaining: number;
}
interface PlanLimits {
    dailyFreeTokens: number;
    monthlyTotalTokens: number;
    allowedModels: string[];
}
export declare class TokenService {
    private readonly redis;
    private readonly prisma;
    constructor(redis: RedisService, prisma: PrismaService);
    checkQuota(userId: string, estimated?: number): Promise<TokenCheckResult>;
    increment(userId: string, tokens: number, source: 'free' | 'paid'): Promise<void>;
    getUsageToday(userId: string): Promise<{
        freeUsed: number;
        freeLimit: number;
        paidUsed: number;
        paidLimit: number;
    }>;
    getUsageHistory(userId: string, month?: string): Promise<{
        date: string;
        freeTokensUsed: number;
        paidTokensUsed: number;
        requestsCount: number;
    }[]>;
    invalidatePlanCache(userId: string): Promise<void>;
    getCachedPlan(userId: string): Promise<PlanLimits>;
}
export {};
