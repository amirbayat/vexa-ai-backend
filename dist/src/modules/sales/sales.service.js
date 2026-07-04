"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.SalesService = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const openai_compatible_1 = require("@ai-sdk/openai-compatible");
const ai_1 = require("ai");
const prisma_service_1 = require("../../prisma/prisma.service");
const redis_service_1 = require("../../redis/redis.service");
const IRAN_OFFSET_MS = 3.5 * 60 * 60 * 1000;
function iranDate() {
    return new Date(Date.now() + IRAN_OFFSET_MS).toISOString().slice(0, 10);
}
const SALES_SYSTEM_PROMPT = `تو دستیار فروش هوشمند نیوو هستی. نیوو یک سرویس هوش مصنوعی ایرانی است که دسترسی راحت و پرداخت ریالی ارائه می‌دهد.

## قوانین مطلق — هرگز نقض نکن:
1. فقط درباره نیوو، پلن‌ها، و کاربردهای هوش مصنوعی صحبت کن
2. اگر کاربر سوال فنی پرسید، کمک درسی خواست، متن نوشت، یا کد خواست، بگو: "این کارها بعد از اشتراک برات انجام می‌دم 😊 اول بذار بگم چطور کمکت می‌کنم"
3. رقبا (ChatGPT مستقیم، Claude و...) را نام نبر یا مقایسه نکن
4. قیمت‌ها را دقیق بگو — نه بالاتر، نه پایین‌تر
5. حداکثر ۱۵ پیام رد و بدل کن — بعد حتماً به ثبت‌نام هدایت کن
6. یک سوال در هر پیام — نه بیشتر
7. از ایموجی‌های مناسب استفاده کن ولی زیاده‌روی نکن

## جریان مکالمه:
- مرحله ۱ (پیام ۱-۳): کشف — شغل، سن، کارهای روزانه
- مرحله ۲ (پیام ۴-۶): درد — چالش اصلی، وقت تلف‌شده
- مرحله ۳ (پیام ۷-۱۱): ارزش — ۳-۵ use case شخصی‌سازی‌شده برای این کاربر خاص
- مرحله ۴ (پیام ۱۲-۱۵): توصیه یک پلن مشخص با دلیل + دعوت به ثبت‌نام

## پلن‌ها:
- رایگان: ۵ پیام در روز، مدل GPT-4o mini، بدون هزینه — برای تست اولیه
- نقره‌ای: ۵۰ پیام در روز، GPT-4o mini، ۱۵۰,۰۰۰ تومان ماهانه — برای استفاده روزانه متوسط
- طلایی: نامحدود، GPT-4o و GPT-4 Turbo (قوی‌ترین مدل‌ها)، ۳۵۰,۰۰۰ تومان ماهانه — برای استفاده حرفه‌ای و روزانه سنگین

## لحن و سبک:
- صمیمی، مثل یه دوست متخصص که دلسوزانه کمک می‌کند
- پیام‌های کوتاه — حداکثر ۳-۴ جمله
- فارسی محاوره‌ای و ساده — نه رسمی
- وقتی use case می‌دهی: مشخص و قابل تصور باش، نه کلی`;
let SalesService = class SalesService {
    prisma;
    redis;
    config;
    provider;
    constructor(prisma, redis, config) {
        this.prisma = prisma;
        this.redis = redis;
        this.config = config;
        this.provider = (0, openai_compatible_1.createOpenAICompatible)({
            name: 'liara',
            baseURL: this.config.get('LIARA_AI_BASE_URL'),
            apiKey: this.config.get('LIARA_API_KEY'),
        });
    }
    async chat(dto, ip) {
        const rlKey = `sales:rl:${ip}:${iranDate()}`;
        const count = await this.redis.incr(rlKey);
        if (count === 1)
            await this.redis.expire(rlKey, 3600);
        if (count > 30)
            throw new common_1.HttpException('تعداد درخواست بیش از حد مجاز است', 429);
        const messages = dto.messages.slice(-14);
        const isDone = messages.length >= 14;
        let text;
        try {
            const result = await (0, ai_1.generateText)({
                model: this.provider('openai/gpt-4o-mini'),
                system: SALES_SYSTEM_PROMPT,
                messages: messages.map(m => ({ role: m.role, content: m.content })),
                maxOutputTokens: 400,
            });
            text = result.text;
        }
        catch {
            return {
                reply: 'سرویس هوش مصنوعی در حال حاضر در دسترس نیست. چند دقیقه دیگر دوباره امتحان کن 🙏',
                isDone: false,
            };
        }
        const recommendedPlan = this.extractPlan(text);
        return { reply: text, isDone, ...(recommendedPlan ? { recommendedPlan } : {}) };
    }
    async saveLead(dto) {
        const base = {
            ...(dto.sessionId !== undefined && { sessionId: dto.sessionId }),
            ...(dto.phone !== undefined && { phone: dto.phone }),
            ...(dto.name !== undefined && { name: dto.name }),
            ...(dto.age !== undefined && { age: dto.age }),
            ...(dto.city !== undefined && { city: dto.city }),
            ...(dto.jobTitle !== undefined && { jobTitle: dto.jobTitle }),
            ...(dto.interests !== undefined && { interests: dto.interests }),
            ...(dto.chatHistory !== undefined && { chatHistory: dto.chatHistory }),
            ...(dto.recommendedPlan !== undefined && { recommendedPlan: dto.recommendedPlan }),
            source: dto.source ?? 'pricing_page',
        };
        const lead = await this.prisma.leadProfile.upsert({
            where: { sessionId: dto.sessionId ?? '' },
            create: base,
            update: base,
        });
        return { id: lead.id };
    }
    extractPlan(text) {
        if (text.includes('طلایی'))
            return 'gold';
        if (text.includes('نقره‌ای') || text.includes('نقره ای'))
            return 'silver';
        if (text.includes('رایگان'))
            return 'free';
        return undefined;
    }
};
exports.SalesService = SalesService;
exports.SalesService = SalesService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        redis_service_1.RedisService,
        config_1.ConfigService])
], SalesService);
//# sourceMappingURL=sales.service.js.map