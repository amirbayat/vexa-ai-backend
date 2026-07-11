-- محدودیت خروجی ربات فروش دیگر هاردکد (400) در sales.service.ts نیست — از ادمین (تب «مدل و تنظیمات») قابل‌تنظیم است.
-- فقط ADD COLUMN — ایمن برای اجرا روی پروداکشن.

ALTER TABLE "sales_bot_config" ADD COLUMN "maxOutputTokens" INTEGER NOT NULL DEFAULT 800;
