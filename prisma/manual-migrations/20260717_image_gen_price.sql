-- docs/PRD-chat-images.md بخش ۵.۵ — هزینه‌ی ثابت هر عکس تولیدشده، به‌ازای هر مدل (ادمین‌قابل‌تغییر)

ALTER TABLE "ai_models" ADD COLUMN     "imageGenPriceUsd" DOUBLE PRECISION;
