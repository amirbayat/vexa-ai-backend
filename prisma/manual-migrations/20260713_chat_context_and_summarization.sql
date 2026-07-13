-- خلاصه‌سازی مبتنی بر توکن + context عمومی/پلنی برای چت اصلی
-- docs/PRD-chat-context-and-summarization.md
-- فقط ADD COLUMN و CREATE TABLE (بدون DROP/ALTER روی داده‌ی موجود) — ایمن برای اجرا روی پروداکشن.

-- AlterTable: Plan — context اختصاصی هر پلن
ALTER TABLE "plans" ADD COLUMN "contextMd" TEXT;

-- AlterTable: Conversation — نشانگر «تا کجا خلاصه شده»
ALTER TABLE "conversations" ADD COLUMN "summarizedUntilCreatedAt" TIMESTAMP(3);

-- CreateTable: ChatConfig (singleton)
CREATE TABLE "chat_config" (
    "id" TEXT NOT NULL DEFAULT 'singleton',
    "globalContextMd" TEXT NOT NULL DEFAULT '',
    "summaryTriggerTokens" INTEGER NOT NULL DEFAULT 5000,
    "summaryMaxTokens" INTEGER NOT NULL DEFAULT 200,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "chat_config_pkey" PRIMARY KEY ("id")
);
