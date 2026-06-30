export declare enum FeedbackCategory {
    FEATURE_REQUEST = "FEATURE_REQUEST",
    BUG = "BUG",
    UX = "UX",
    PRICING = "PRICING",
    GENERAL = "GENERAL"
}
export declare class CreateFeedbackDto {
    content: string;
    category?: FeedbackCategory;
}
