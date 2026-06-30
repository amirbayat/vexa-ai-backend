import { ConfigService } from '@nestjs/config';
export declare class ZarinpalService {
    private readonly config;
    private readonly merchantId;
    private readonly baseUrl;
    private readonly gatewayUrl;
    constructor(config: ConfigService);
    requestPayment(amount: number, description: string, callbackUrl: string): Promise<{
        authority: string;
        paymentUrl: string;
    }>;
    verifyPayment(amount: number, authority: string): Promise<{
        success: boolean;
        refId: null;
    } | {
        success: boolean;
        refId: string;
    }>;
}
