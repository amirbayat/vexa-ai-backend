#!/bin/sh
set -e

echo ">>> Generating Prisma client..."
npx prisma generate

echo ">>> Pushing database schema..."
npx prisma db push

echo ">>> Seeding initial plans..."
npx ts-node --transpile-only prisma/seeds/plans.seed.ts

echo ">>> Starting NestJS..."
exec npm run start:dev
