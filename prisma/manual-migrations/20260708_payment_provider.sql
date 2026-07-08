-- افزودن پشتیبانی چند درگاهی پرداخت (زرین‌پال + وندار)
-- توجه: خروجی خودکار `prisma migrate diff` ستون authority را DROP و providerRef را
-- به‌عنوان ستون خالی جدید ADD می‌کرد که باعث از دست رفتن مقادیر authority موجود می‌شد.
-- این نسخه به‌جایش authority را RENAME می‌کند تا داده‌های فعلی حفظ شوند.

-- CreateEnum
CREATE TYPE "PaymentProvider" AS ENUM ('ZARINPAL', 'VANDAR');

-- Rename authority -> providerRef (حفظ داده‌های موجود)
ALTER TABLE "payments" RENAME COLUMN "authority" TO "providerRef";
ALTER INDEX "payments_authority_key" RENAME TO "payments_providerRef_key";

-- افزودن ستون provider — پیش‌فرض ZARINPAL چون همه‌ی رکوردهای فعلی از زرین‌پال بوده‌اند
ALTER TABLE "payments" ADD COLUMN "provider" "PaymentProvider" NOT NULL DEFAULT 'ZARINPAL';
