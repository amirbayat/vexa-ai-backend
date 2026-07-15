-- AlterTable
ALTER TABLE "ai_models" DROP COLUMN "imageGenPriceUsd",
ADD COLUMN     "imageGenInputImagePricePerM" DOUBLE PRECISION,
ADD COLUMN     "imageGenOutputImagePricePerM" DOUBLE PRECISION;
