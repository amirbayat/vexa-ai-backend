import { OnApplicationBootstrap } from '@nestjs/common';
import type { Queue } from 'bull';
export declare class QueueService implements OnApplicationBootstrap {
    private readonly tokenFlushQueue;
    private readonly feedbackSummaryQueue;
    private readonly logger;
    constructor(tokenFlushQueue: Queue, feedbackSummaryQueue: Queue);
    onApplicationBootstrap(): Promise<void>;
}
