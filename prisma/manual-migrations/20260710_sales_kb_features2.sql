-- افزودنی‌های فاز دوم — docs/PRD-sales-kb-rag-and-plan-context.md بخش الف:
-- (۱) نوع مدل (چت/embedding) روی ai_models تا مدل‌های embedding در دراپ‌داون‌های
--     چت (پلن‌ها، مسیریاب مدل) سهواً انتخاب‌پذیر نشوند
-- (۲) مدل embedding قابل‌تغییر از ادمین (sales_bot_config.embeddingModel)
-- (۳) ستون‌های هزینه‌ی embedding (جدا از هزینه‌ی چت) روی sales_bot_daily_usage
-- (۴) جدول sales_chat_sessions برای تاریخچه‌ی مکالمات ربات فروش در ادمین
--
-- پیش‌نیاز: 20260710_sales_kb_entries.sql باید قبل از این روی همین دیتابیس اجرا شده باشد.
-- فقط CREATE/ADD COLUMN (بدون DROP) — ایمن برای اجرا روی پروداکشن.

-- CreateEnum
CREATE TYPE "AiModelType" AS ENUM ('CHAT', 'EMBEDDING');

-- AlterTable
ALTER TABLE "ai_models" ADD COLUMN     "modelType" "AiModelType" NOT NULL DEFAULT 'CHAT';

-- AlterTable
ALTER TABLE "sales_bot_config" ADD COLUMN     "embeddingModel" TEXT NOT NULL DEFAULT 'openai/text-embedding-3-small';

-- AlterTable
ALTER TABLE "sales_bot_daily_usage" ADD COLUMN     "embeddingCalls" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "embeddingCostToman" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "embeddingCostUsdMicros" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "embeddingTokens" INTEGER NOT NULL DEFAULT 0;

-- CreateTable
CREATE TABLE "sales_chat_sessions" (
    "id" TEXT NOT NULL,
    "sessionId" TEXT NOT NULL,
    "messages" JSONB NOT NULL,
    "messageCount" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lastMessageAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "sales_chat_sessions_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "sales_chat_sessions_sessionId_key" ON "sales_chat_sessions"("sessionId");

-- CreateIndex
CREATE INDEX "sales_chat_sessions_lastMessageAt_idx" ON "sales_chat_sessions"("lastMessageAt");

-- Seed: مدل embedding پیش‌فرضی که همین الان در کد استفاده می‌شود — تا هزینه‌اش
-- هم از روز اول در آنالیتیکس محاسبه‌پذیر باشد. ایمن برای اجرای دوباره.
INSERT INTO "ai_models" ("id", "name", "displayName", "provider", "modelType", "inputPricePerM", "outputPricePerM", "supportsVision", "isActive", "sortOrder", "tier", "tokenizerFamily", "avgCharsPerToken", "createdAt")
SELECT gen_random_uuid()::text, 'openai/text-embedding-3-small', 'Text Embedding 3 Small', 'openai', 'EMBEDDING', 0.02, 0, false, true, 0, 'SIMPLE', 'o200k_base', 4, CURRENT_TIMESTAMP
WHERE NOT EXISTS (SELECT 1 FROM "ai_models" WHERE "name" = 'openai/text-embedding-3-small');
