-- مسیریابی مدل بر اساس درصد مصرف روزانه — فقط ADD COLUMN + CREATE TABLE، هیچ داده‌ی موجودی تغییر نمی‌کند.

BEGIN;

ALTER TABLE "plans" ADD COLUMN "simpleModel" TEXT DEFAULT 'openai/gpt-5-nano';

CREATE TABLE "plan_routing_steps" (
  "id"           TEXT NOT NULL,
  "planId"       TEXT NOT NULL,
  "order"        INTEGER NOT NULL,
  "thresholdPct" INTEGER NOT NULL,
  "models"       JSONB NOT NULL,
  "createdAt"    TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt"    TIMESTAMP(3) NOT NULL,

  CONSTRAINT "plan_routing_steps_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "plan_routing_steps_planId_order_key" ON "plan_routing_steps"("planId", "order");
CREATE INDEX "plan_routing_steps_planId_idx" ON "plan_routing_steps"("planId");

ALTER TABLE "plan_routing_steps" ADD CONSTRAINT "plan_routing_steps_planId_fkey"
  FOREIGN KEY ("planId") REFERENCES "plans"("id") ON DELETE CASCADE ON UPDATE CASCADE;

COMMIT;

-- بعد از اجرا: طبق مرحله‌ی ۵ پلن اجرا، اول مدل‌های لازم را به allowedModels اکو/پلاس اضافه کن،
-- بعد از صفحه‌ی جدید ادمین «مسیریابی مدل‌ها» استپ‌ها و simpleModel هر پلن را وارد کن.
