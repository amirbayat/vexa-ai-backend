-- AlterTable
ALTER TABLE "anonymous_chat_config" ADD COLUMN     "samplePrompts" TEXT[] DEFAULT ARRAY['این ایمیل رو رسمی‌تر و مودبانه‌تر بنویس', 'خلاصه‌ی این متن رو در ۳ خط بگو', 'یک برنامه‌ی غذایی هفتگی سالم پیشنهاد بده', 'این کد رو دیباگ کن و توضیح بده مشکلش چیه', 'برام یک کپشن جذاب برای اینستاگرام بنویس']::TEXT[],
ADD COLUMN     "signupBannerAfterMessages" INTEGER NOT NULL DEFAULT 3;

