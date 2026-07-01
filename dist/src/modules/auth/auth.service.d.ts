import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../../prisma/prisma.service';
import { RedisService } from '../../redis/redis.service';
import { SmsService } from '../../sms/sms.service';
export declare class AuthService {
    private readonly prisma;
    private readonly redis;
    private readonly jwt;
    private readonly config;
    private readonly sms;
    constructor(prisma: PrismaService, redis: RedisService, jwt: JwtService, config: ConfigService, sms: SmsService);
    sendOtp(rawPhone: string): Promise<{
        message: string;
    }>;
    verifyOtp(rawPhone: string, code: string): Promise<{
        user: {
            id: string;
            phone: string;
            role: import("@prisma/client").$Enums.Role;
            name: string | null;
        };
        accessToken: string;
        refreshToken: string;
    }>;
    refresh(rawToken: string): Promise<{
        accessToken: string;
        refreshToken: string;
    }>;
    logout(rawToken: string): Promise<void>;
    getMe(userId: string): Promise<{
        subscription: {
            plan: {
                name: string;
                dailyFreeTokens: number;
                monthlyTotalTokens: number;
                allowedModels: import("@prisma/client/runtime/client").JsonValue;
            };
            status: import("@prisma/client").$Enums.SubscriptionStatus;
            periodEnd: Date;
        } | null;
        id: string;
        phone: string;
        name: string | null;
        role: import("@prisma/client").$Enums.Role;
        createdAt: Date;
    } | null>;
    private issueTokens;
}
