// مقادیر مجاز reasoning effort — هم برای Plan.reasoningEffort (پیش‌فرض پلن) و هم
// PlanRoutingStep.reasoningEffort (override به‌ازای استپ بودجه‌ای). زیرمجموعه‌ی محدودتری از
// کل union پذیرفته‌شده توسط AI SDK ('provider-default'|'none'|...|'xhigh') — همان چهار سطحی
// که برای کنترل ادمین معنادارند.
export const REASONING_EFFORT_VALUES = ['minimal', 'low', 'medium', 'high'] as const
export type ReasoningEffortValue = (typeof REASONING_EFFORT_VALUES)[number]
