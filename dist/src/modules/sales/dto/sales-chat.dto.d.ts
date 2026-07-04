export declare class SalesChatMessageDto {
    role: 'user' | 'assistant';
    content: string;
}
export declare class SalesChatDto {
    messages: SalesChatMessageDto[];
    sessionId: string;
}
export declare class SaveLeadDto {
    sessionId?: string;
    phone?: string;
    name?: string;
    age?: number;
    city?: string;
    jobTitle?: string;
    interests?: string[];
    chatHistory?: SalesChatMessageDto[];
    recommendedPlan?: string;
    source?: string;
}
