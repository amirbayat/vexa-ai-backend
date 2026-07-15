-- docs/PRD-chat-images.md — فلگ تولید عکس روی مدل + سقف قابل‌تنظیم تعداد/حجم عکس هر پیام

-- AlterTable
ALTER TABLE "ai_models" ADD COLUMN     "supportsImageGen" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE "chat_config" ADD COLUMN     "maxImageSizeMb" INTEGER NOT NULL DEFAULT 8,
ADD COLUMN     "maxImagesPerMessage" INTEGER NOT NULL DEFAULT 4;
