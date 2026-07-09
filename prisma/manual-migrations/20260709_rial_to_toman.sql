-- مهاجرت واحد پول: ریال → تومان
--
-- این مایگریشن هم schema را تغییر می‌دهد (rename ستون‌ها) هم داده‌های موجود را تبدیل می‌کند
-- (تقسیم بر ۱۰). قبل از اجرا روی پروداکشن حتماً از دیتابیس بک‌آپ بگیرید.
--
-- ترتیب اجرا: این فایل باید *قبل* از دیپلوی کد جدید (که ستون‌های جدید را می‌خواهد) روی
-- پروداکشن اجرا شود، طبق docs/prisma/MANUAL_DB_CHANGES.md.

BEGIN;

-- ── ۱. Rename ستون‌هایی که در نامشان "Rial" داشتند ──────────────────────────
ALTER TABLE "messages"              RENAME COLUMN "costRial"          TO "costToman";
ALTER TABLE "daily_usage"           RENAME COLUMN "costRial"          TO "costToman";
ALTER TABLE "user_quota_overrides"  RENAME COLUMN "dailyBudgetRial"   TO "dailyBudgetToman";
ALTER TABLE "wallets"                RENAME COLUMN "balanceRial"       TO "balanceToman";
ALTER TABLE "wallet_transactions"    RENAME COLUMN "amountRial"        TO "amountToman";

-- ── ۲. تبدیل داده‌های موجود: ریال → تومان (تقسیم بر ۱۰، با گرد کردن نه truncate) ──
UPDATE "plans"               SET "priceMonthly"     = ROUND("priceMonthly"::numeric / 10);
UPDATE "payments"            SET "amount"            = ROUND("amount"::numeric / 10);
UPDATE "invoices"            SET "amount"            = ROUND("amount"::numeric / 10),
                                  "taxAmount"         = ROUND("taxAmount"::numeric / 10);
UPDATE "messages"            SET "costToman"         = ROUND("costToman"::numeric / 10);
UPDATE "daily_usage"         SET "costToman"         = ROUND("costToman"::numeric / 10);
UPDATE "user_quota_overrides" SET "dailyBudgetToman" = ROUND("dailyBudgetToman"::numeric / 10)
                                  WHERE "dailyBudgetToman" IS NOT NULL;
UPDATE "wallets"              SET "balanceToman"      = ROUND("balanceToman"::numeric / 10);
UPDATE "wallet_transactions"   SET "amountToman"       = ROUND("amountToman"::numeric / 10);

COMMIT;

-- ── نکات ─────────────────────────────────────────────────────────────────────
-- • AiModel.inputPricePerM / outputPricePerM (دلار) و Message.costUsdMicros* (دلار × ۱M)
--   دست‌نخورده می‌مانند — واحدشان دلار است، نه ریال/تومان.
-- • درگاه‌های پرداخت (زرین‌پال/وندار/زیبال) همچنان ریال می‌خواهند — تبدیل تومان→ریال
--   (× ۱۰) از این به بعد فقط در back-end/src/modules/payments/payments.service.ts
--   (دو خط: initiate() و verify()) انجام می‌شود، جای دیگری نه.
-- • بعد از اجرای این SQL، متغیرهای محیطی پروداکشن را هم آپدیت کنید (فایل .env.production
--   شما، نه این ریپو): USD_TO_RIAL → USD_TO_TOMAN (مقدار را هم ÷۱۰ کنید، مثلاً 900000 → 90000)
--   و FREE_PLAN_MONTHLY_BUDGET_RIAL → FREE_PLAN_MONTHLY_BUDGET_TOMAN (مثلاً 50000 → 5000).
--   بعد از آپدیت این‌ها، docker compose را با --build بالا بیاورید تا کد جدید هم دیپلوی شود.
