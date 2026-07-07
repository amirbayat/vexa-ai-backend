import { MODEL_TIERS, TOKENIZER_FAMILIES } from './create-model.dto';
export declare class UpdateModelDto {
    name?: string;
    displayName?: string;
    provider?: string;
    inputPricePerM?: number;
    outputPricePerM?: number;
    supportsVision?: boolean;
    isActive?: boolean;
    sortOrder?: number;
    tier?: (typeof MODEL_TIERS)[number];
    tokenizerFamily?: (typeof TOKENIZER_FAMILIES)[number];
    avgCharsPerToken?: number;
}
