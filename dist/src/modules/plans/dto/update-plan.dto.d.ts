export declare class UpdatePlanDto {
    name?: string;
    priceMonthly?: number;
    dailyFreeTokens?: number;
    monthlyTotalTokens?: number;
    allowedModels?: string[];
    features?: Record<string, unknown>;
    isActive?: boolean;
    sortOrder?: number;
}
