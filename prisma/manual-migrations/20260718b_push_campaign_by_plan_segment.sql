-- AlterEnum
ALTER TYPE "PushCampaignSegment" ADD VALUE 'BY_PLAN';

-- AlterTable
ALTER TABLE "push_campaigns" ADD COLUMN     "planIds" TEXT[] DEFAULT ARRAY[]::TEXT[];

