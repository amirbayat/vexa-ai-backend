-- docs/PRD-chat-images.md بخش ۵.۶ — فرمت‌های مجاز عکس چت هم مثل سقف حجم/تعداد از ادمین قابل‌تغییر شد

ALTER TABLE "chat_config" ADD COLUMN     "allowedImageFormats" JSONB NOT NULL DEFAULT '["png","jpeg","webp","gif"]';
