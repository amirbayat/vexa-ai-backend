-- docs/PRD-pay-as-you-go-wallet.md — پلن مصرفی (Pay-As-You-Go): بدون بودجه‌ی درصدی/fallback پله‌ای،
-- مصرف واقعی × ضریب قابل‌تنظیم از کیف‌پول کم می‌شود. Payment از این پس می‌تواند بدون Plan هم باشد
-- (شارژ کیف‌پول)، پس planId nullable شد و یک kind discriminator اضافه شد.

-- CreateEnum
CREATE TYPE "PaymentKind" AS ENUM ('SUBSCRIPTION', 'WALLET_TOPUP');

-- DropForeignKey
ALTER TABLE "payments" DROP CONSTRAINT "payments_planId_fkey";

-- AlterTable
ALTER TABLE "plans" ADD COLUMN     "isPayAsYouGo" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "payAsYouGoMarkup" DOUBLE PRECISION DEFAULT 1.3,
ADD COLUMN     "payAsYouGoMinActivationToman" INTEGER DEFAULT 1000000,
ADD COLUMN     "payAsYouGoMinTopupToman" INTEGER DEFAULT 500000,
ADD COLUMN     "payAsYouGoTopupPresets" JSONB DEFAULT '[1000000,2000000,5000000]';

-- AlterTable
ALTER TABLE "payments" ADD COLUMN     "kind" "PaymentKind" NOT NULL DEFAULT 'SUBSCRIPTION',
ALTER COLUMN "planId" DROP NOT NULL;

-- AlterTable
ALTER TABLE "invoices" ALTER COLUMN "planName" DROP NOT NULL;

-- AddForeignKey
ALTER TABLE "payments" ADD CONSTRAINT "payments_planId_fkey" FOREIGN KEY ("planId") REFERENCES "plans"("id") ON DELETE SET NULL ON UPDATE CASCADE;
