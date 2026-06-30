import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../prisma/prisma.service';
export declare class FeedbackSummaryProcessor {
    private readonly prisma;
    private readonly config;
    private readonly logger;
    private readonly provider;
    constructor(prisma: PrismaService, config: ConfigService);
    handleSummarize(): Promise<void>;
}
