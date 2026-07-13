-- AlterTable
ALTER TABLE "users" ADD COLUMN     "trialEndedAt" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "growth_config" ADD COLUMN     "postTrialGraceHours" INTEGER NOT NULL DEFAULT 24;

