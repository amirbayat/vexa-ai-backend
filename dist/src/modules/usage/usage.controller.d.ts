import { JwtPayload } from '../../common/decorators/current-user.decorator';
import { TokenService } from './token.service';
export declare class UsageController {
    private readonly tokenService;
    constructor(tokenService: TokenService);
    getToday(user: JwtPayload): Promise<{
        freeUsed: number;
        freeLimit: number;
        paidUsed: number;
        paidLimit: number;
    }>;
    getHistory(user: JwtPayload, month?: string): Promise<{
        date: string;
        freeTokensUsed: number;
        paidTokensUsed: number;
        requestsCount: number;
    }[]>;
}
