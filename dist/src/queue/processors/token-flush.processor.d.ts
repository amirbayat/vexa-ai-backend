import { PrismaService } from '../../prisma/prisma.service';
import { RedisService } from '../../redis/redis.service';
export declare class TokenFlushProcessor {
    private readonly redis;
    private readonly prisma;
    private readonly logger;
    constructor(redis: RedisService, prisma: PrismaService);
    handleFlush(): Promise<void>;
    private scanKeys;
}
