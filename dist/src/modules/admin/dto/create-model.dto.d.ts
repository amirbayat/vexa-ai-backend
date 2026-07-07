export declare const MODEL_TIERS: readonly ["SIMPLE", "MEDIUM", "COMPLEX"];
export declare const TOKENIZER_FAMILIES: readonly ["o200k_base", "cl100k_base", "approximate"];
export declare class CreateModelDto {
    name: string;
    displayName: string;
    provider: string;
    inputPricePerM: number;
    outputPricePerM: number;
    supportsVision?: boolean;
    isActive?: boolean;
    sortOrder?: number;
    tier?: (typeof MODEL_TIERS)[number];
    tokenizerFamily?: (typeof TOKENIZER_FAMILIES)[number];
    avgCharsPerToken?: number;
}
