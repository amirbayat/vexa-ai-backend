import { ConfigService } from '@nestjs/config';
export declare class SmsService {
    private readonly config;
    private readonly logger;
    private readonly api;
    private readonly template;
    private readonly devMode;
    constructor(config: ConfigService);
    sendOtp(receptor: string, code: string): Promise<void>;
}
