import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../prisma/prisma.service';
import { RedisService } from '../../redis/redis.service';
import type { SalesChatDto, SaveLeadDto } from './dto/sales-chat.dto';
export declare class SalesService {
    private readonly prisma;
    private readonly redis;
    private readonly config;
    private readonly provider;
    constructor(prisma: PrismaService, redis: RedisService, config: ConfigService);
    chat(dto: SalesChatDto, ip: string): Promise<{
        reply: string;
        isDone: boolean;
        recommendedPlan?: string;
    }>;
    saveLead(dto: SaveLeadDto): Promise<{
        id: string;
    }>;
    private extractPlan;
}
