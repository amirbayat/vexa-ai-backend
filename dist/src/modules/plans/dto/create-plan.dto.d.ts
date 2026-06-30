export declare class CreatePlanDto {
    name: string;
    priceMonthly: number;
    dailyFreeTokens: number;
    monthlyTotalTokens: number;
    allowedModels: string[];
    features?: Record<string, unknown>;
    isActive: boolean;
    sortOrder: number;
}
