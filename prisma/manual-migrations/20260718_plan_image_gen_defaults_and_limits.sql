-- AlterTable
ALTER TABLE "plans" ADD COLUMN     "defaultImageGenModel" TEXT,
ADD COLUMN     "imageGenWindowHours" INTEGER DEFAULT 24,
ADD COLUMN     "maxImageGenPerDay" INTEGER,
ADD COLUMN     "maxImageGenPerWindow" INTEGER;
