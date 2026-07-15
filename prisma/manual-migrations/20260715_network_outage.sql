-- فیچر «قطع نت» — ادمین شروع/پایان قطعی اینترنت را ثبت می‌کند؛ در لحظه‌ی پایان، مدت قطعی به
-- periodEnd اشتراک‌های فعال (غیر رایگان) اضافه می‌شود تا روزهای باقی‌مانده‌ی کاربران هدر نرود.

-- CreateTable
CREATE TABLE "network_outages" (
    "id" TEXT NOT NULL,
    "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "endedAt" TIMESTAMP(3),
    "extendedDays" DOUBLE PRECISION,
    "affectedCount" INTEGER,
    "createdByAdminId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "network_outages_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "network_outages_endedAt_idx" ON "network_outages"("endedAt");
