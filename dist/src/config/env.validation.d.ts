declare class EnvironmentVariables {
    DATABASE_URL: string;
    REDIS_URL: string;
    JWT_SECRET: string;
    JWT_EXPIRES_IN: string;
    JWT_REFRESH_SECRET: string;
    JWT_REFRESH_EXPIRES_IN: string;
    LIARA_AI_BASE_URL: string;
    LIARA_API_KEY: string;
    ZARINPAL_MERCHANT_ID: string;
    KAVENEGAR_API_KEY: string;
    APP_URL: string;
    PORT: number;
}
export declare function validate(config: Record<string, unknown>): EnvironmentVariables;
export {};
