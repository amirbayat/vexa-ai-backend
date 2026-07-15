-- docs/PRD-chat-images.md — سوییچ ادمین برای خاموش/روشن کردن تشخیص خودکار نیت تولید عکس
-- وسط چت معمولی (heuristic، نه قطعی) — بدون نیاز به دیپلوی اگر false-positive زیاد شد

ALTER TABLE "chat_config" ADD COLUMN     "implicitImageGenEnabled" BOOLEAN NOT NULL DEFAULT true;
