#!/bin/sh
set -e

echo ">>> [1/4] Generating Prisma client..."
npx prisma generate

echo ">>> [2/4] Pushing database schema..."
npx prisma db push --accept-data-loss

echo ">>> [3/6] Seeding plans (upsert — safe to re-run)..."
npx ts-node --transpile-only prisma/seeds/plans.seed.ts

echo ">>> [4/6] Seeding AI models (upsert — safe to re-run)..."
npx ts-node --transpile-only prisma/seeds/models.seed.ts

echo ">>> [5/6] Seeding usage-analytics topics/segments (safe to re-run)..."
npx ts-node --transpile-only prisma/seeds/topics.seed.ts
npx ts-node --transpile-only prisma/seeds/segments.seed.ts

echo ">>> [6/6] Starting NestJS in production mode..."
exec node dist/src/main
