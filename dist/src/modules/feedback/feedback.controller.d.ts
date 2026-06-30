import { JwtPayload } from '../../common/decorators/current-user.decorator';
import { FeedbackService } from './feedback.service';
import { CreateFeedbackDto } from './dto/create-feedback.dto';
export declare class FeedbackController {
    private readonly feedbackService;
    constructor(feedbackService: FeedbackService);
    create(user: JwtPayload, dto: CreateFeedbackDto): Promise<{
        message: "نظر شما با موفقیت ثبت شد";
    }>;
    getAll(page?: string, limit?: string): Promise<{
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
