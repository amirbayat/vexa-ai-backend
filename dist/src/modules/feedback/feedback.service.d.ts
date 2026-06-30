import { PrismaService } from '../../prisma/prisma.service';
import { CreateFeedbackDto } from './dto/create-feedback.dto';
import { ConfigService } from '@nestjs/config';
export declare class FeedbackService {
    private readonly prisma;
    private readonly config;
    private readonly provider;
    constructor(prisma: PrismaService, config: ConfigService);
    create(userId: string | null, dto: CreateFeedbackDto): Promise<{
        message: "نظر شما با موفقیت ثبت شد";
    }>;
    getAll(page?: number, limit?: number): Promise<{
        items: any;
        total: any;
        page: number;
        limit: number;
    }>;
    getSummary(): Promise<any>;
    triggerSummary(): Promise<{
        message: "هنوز خلاصه‌ای در دسترس نیست";
        processed?: undefined;
    } | {
        message: "نظر شما با موفقیت ثبت شد";
        processed: any;
    }>;
}
