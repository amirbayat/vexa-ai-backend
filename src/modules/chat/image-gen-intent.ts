// docs/PRD-chat-images.md — تشخیص خودکار نیت «تولید عکس» وسط یک پیام چت معمولی (بدون
// toggle صریح کاربر در فرانت). عمداً فقط heuristic کلیدواژه‌ای است، بدون تماس LLM جدا —
// یک تماس طبقه‌بندی اضافه روی *هر* پیام (که اکثرشان ربطی به عکس ندارند) هزینه/تأخیر بی‌مورد
// به کل چت اضافه می‌کرد. یعنی عمداً فرمول‌بندی‌های خلاقانه/غیرمستقیم را از دست می‌دهد؛ اگر
// false-positive/negative زیاد شد، از ادمین (ChatConfig.implicitImageGenEnabled) خاموش می‌شود.
const IMAGE_NOUNS = ['عکس', 'تصویر', 'نقاشی', 'لوگو', 'طرح گرافیکی']
const GEN_VERBS = ['بکش', 'بساز', 'بسازی', 'تولید کن', 'طراحی کن', 'درست کن', 'رسم کن']

const nounPattern = IMAGE_NOUNS.join('|')
const verbPattern = GEN_VERBS.join('|')

// یا اسم قبل از فعل («یک عکس از گربه بکش») یا فعل قبل از اسم («بساز یه عکس از گربه») —
// حداکثر ۲۰ کاراکتر فاصله تا جمله‌های نامرتبط با هم قاطی نشوند
const IMAGE_GEN_INTENT_RE = new RegExp(
  `(${nounPattern})[^.!؟\\n]{0,20}(${verbPattern})|(${verbPattern})[^.!؟\\n]{0,20}(${nounPattern})`,
)

export function detectImageGenIntent(content: string): boolean {
  return IMAGE_GEN_INTENT_RE.test(content)
}
