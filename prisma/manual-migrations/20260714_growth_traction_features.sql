-- دوره‌ی آزمایشی، هدیه‌ی خوش‌آمد، موتور کد تخفیف، معرفی دوستان
-- docs/PRD-growth-traction-features.md
-- ⚠️ برخلاف مایگریشن‌های قبلی این پروژه، این یکی صرفاً CREATE/ADD نیست — چون
-- "users"."referralCode" باید NOT NULL + UNIQUE باشد ولی جدول از قبل کاربر دارد،
-- باید اول nullable اضافه بشه، backfill بشه، بعد NOT NULL/UNIQUE ست بشه (وگرنه
-- روی جدول پر از رکورد خطا می‌ده). قبل از اجرا روی پروداکشن یک‌بار دیگه بخون.

-- CreateEnum
CREATE TYPE "DiscountSource" AS ENUM ('WELCOME_GIFT', 'EXPIRY_REMINDER', 'REFERRAL', 'MANUAL');

-- AlterTable: users — lifetimeMessageCount + referredByUserId (بی‌خطر، nullable/default دارن)
ALTER TABLE "users" ADD COLUMN "lifetimeMessageCount" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "users" ADD COLUMN "referredByUserId" TEXT;

-- AlterTable: users — referralCode (نیاز به backfill قبل از NOT NULL/UNIQUE)
ALTER TABLE "users" ADD COLUMN "referralCode" TEXT;
UPDATE "users" SET "referralCode" = upper(substr(md5(id || clock_timestamp()::text || random()::text), 1, 8));
ALTER TABLE "users" ALTER COLUMN "referralCode" SET NOT NULL;
CREATE UNIQUE INDEX "users_referralCode_key" ON "users"("referralCode");

-- AlterTable: plans — فیلدهای دوره‌ی آزمایشی
ALTER TABLE "plans" ADD COLUMN "trialDailyMessageLimit" INTEGER,
ADD COLUMN "trialMessageThreshold" INTEGER,
ADD COLUMN "trialRollingWindowHours" INTEGER,
ADD COLUMN "trialRollingWindowLimit" INTEGER,
ADD COLUMN "trialThrottledMessageCount" INTEGER;

-- AlterTable: payments — اتصال به کد تخفیف
ALTER TABLE "payments" ADD COLUMN "discountCodeId" TEXT;

-- CreateTable
CREATE TABLE "growth_config" (
    "id" TEXT NOT NULL DEFAULT 'singleton',
    "welcomeDiscountPercent" INTEGER NOT NULL DEFAULT 20,
    "welcomeDiscountValidHours" INTEGER NOT NULL DEFAULT 72,
    "expiryDiscountPercent" INTEGER NOT NULL DEFAULT 15,
    "referralDiscountPercent" INTEGER NOT NULL DEFAULT 20,
    "referralDiscountValidDays" INTEGER NOT NULL DEFAULT 30,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "growth_config_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "onboarding_gift" (
    "id" TEXT NOT NULL DEFAULT 'singleton',
    "title" TEXT NOT NULL DEFAULT 'هدیه ویژه نیوو به کاربران تازه',
    "description" TEXT NOT NULL DEFAULT '',
    "audioUrl" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "onboarding_gift_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "discount_codes" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "discountPercent" INTEGER NOT NULL,
    "source" "DiscountSource" NOT NULL,
    "issuedToUserId" TEXT,
    "maxUses" INTEGER NOT NULL DEFAULT 1,
    "usedCount" INTEGER NOT NULL DEFAULT 0,
    "expiresAt" TIMESTAMP(3),
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "discount_codes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "discount_code_redemptions" (
    "id" TEXT NOT NULL,
    "discountCodeId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "paymentId" TEXT NOT NULL,
    "redeemedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "discount_code_redemptions_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "discount_codes_code_key" ON "discount_codes"("code");

-- CreateIndex
CREATE INDEX "discount_codes_issuedToUserId_idx" ON "discount_codes"("issuedToUserId");

-- CreateIndex
CREATE UNIQUE INDEX "discount_code_redemptions_paymentId_key" ON "discount_code_redemptions"("paymentId");

-- AddForeignKey
ALTER TABLE "users" ADD CONSTRAINT "users_referredByUserId_fkey" FOREIGN KEY ("referredByUserId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payments" ADD CONSTRAINT "payments_discountCodeId_fkey" FOREIGN KEY ("discountCodeId") REFERENCES "discount_codes"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "discount_codes" ADD CONSTRAINT "discount_codes_issuedToUserId_fkey" FOREIGN KEY ("issuedToUserId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "discount_code_redemptions" ADD CONSTRAINT "discount_code_redemptions_discountCodeId_fkey" FOREIGN KEY ("discountCodeId") REFERENCES "discount_codes"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "discount_code_redemptions" ADD CONSTRAINT "discount_code_redemptions_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "discount_code_redemptions" ADD CONSTRAINT "discount_code_redemptions_paymentId_fkey" FOREIGN KEY ("paymentId") REFERENCES "payments"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
