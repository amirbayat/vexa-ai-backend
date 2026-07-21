-- CreateEnum
CREATE TYPE "AnonFunnelEventType" AS ENUM ('SESSION_CREATED', 'FIRST_MESSAGE_SENT', 'ENTERED_LIMITED_ZONE', 'HARD_BLOCKED', 'CLICKED_SIGNUP_CTA', 'SIGNUP_COMPLETED', 'FIRST_MESSAGE_AFTER_SIGNUP', 'FIRST_PURCHASE');

-- CreateTable
CREATE TABLE "anonymous_chat_config" (
    "id" TEXT NOT NULL DEFAULT 'singleton',
    "enabled" BOOLEAN NOT NULL DEFAULT true,
    "defaultModel" TEXT NOT NULL DEFAULT 'openai/gpt-4o-mini',
    "freeMessageLimit" INTEGER NOT NULL DEFAULT 10,
    "dailyMessageLimitAfterFree" INTEGER NOT NULL DEFAULT 5,
    "maxInputTokens" INTEGER NOT NULL DEFAULT 2000,
    "maxOutputTokens" INTEGER NOT NULL DEFAULT 1000,
    "signupBannerMessage" TEXT NOT NULL DEFAULT '🎁 با ثبت‌نام رایگان، اعتبار و امکانات بیشتری بگیرید',
    "limitedZoneMessage" TEXT NOT NULL DEFAULT 'برای استفاده‌ی کامل و بدون محدودیت از نیوو، ثبت‌نام کنید',
    "blockedMessage" TEXT NOT NULL DEFAULT 'برای ادامه، لازم است ثبت‌نام کنید یا فردا دوباره امتحان کنید.',
    "hintTitle" TEXT NOT NULL DEFAULT 'چطور می‌تونم امروز کمکتون کنم؟',
    "hintSubtitle" TEXT NOT NULL DEFAULT 'هر سوالی داری بپرس — نوشتن، برنامه‌نویسی، ترجمه، تحلیل و خیلی چیزای دیگه',
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "anonymous_chat_config_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "anonymous_identities" (
    "id" TEXT NOT NULL,
    "ip" TEXT NOT NULL,
    "lifetimeMessageCount" INTEGER NOT NULL DEFAULT 0,
    "firstSeenAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lastSeenAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "anonymous_identities_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "anonymous_sessions" (
    "id" TEXT NOT NULL,
    "clientToken" TEXT NOT NULL,
    "identityId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lastSeenAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "migratedToUserId" TEXT,
    "migratedAt" TIMESTAMP(3),
    "utmSource" TEXT,
    "utmMedium" TEXT,
    "utmCampaign" TEXT,
    "utmContent" TEXT,
    "utmTerm" TEXT,
    "referrer" TEXT,
    "landingPath" TEXT,

    CONSTRAINT "anonymous_sessions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "anonymous_conversations" (
    "id" TEXT NOT NULL,
    "sessionId" TEXT NOT NULL,
    "model" TEXT NOT NULL,
    "title" TEXT,
    "totalTokens" INTEGER NOT NULL DEFAULT 0,
    "lastMessageAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "migratedConversationId" TEXT,

    CONSTRAINT "anonymous_conversations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "anonymous_messages" (
    "id" TEXT NOT NULL,
    "conversationId" TEXT NOT NULL,
    "role" "MessageRole" NOT NULL,
    "content" TEXT NOT NULL,
    "tokensInput" INTEGER NOT NULL DEFAULT 0,
    "tokensOutput" INTEGER NOT NULL DEFAULT 0,
    "model" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "anonymous_messages_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "anonymous_funnel_events" (
    "id" TEXT NOT NULL,
    "sessionId" TEXT NOT NULL,
    "eventType" "AnonFunnelEventType" NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "metadata" JSONB,

    CONSTRAINT "anonymous_funnel_events_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "anonymous_identities_ip_key" ON "anonymous_identities"("ip");

-- CreateIndex
CREATE UNIQUE INDEX "anonymous_sessions_clientToken_key" ON "anonymous_sessions"("clientToken");

-- CreateIndex
CREATE INDEX "anonymous_sessions_identityId_idx" ON "anonymous_sessions"("identityId");

-- CreateIndex
CREATE INDEX "anonymous_sessions_migratedToUserId_idx" ON "anonymous_sessions"("migratedToUserId");

-- CreateIndex
CREATE INDEX "anonymous_conversations_sessionId_lastMessageAt_idx" ON "anonymous_conversations"("sessionId", "lastMessageAt" DESC);

-- CreateIndex
CREATE INDEX "anonymous_messages_conversationId_createdAt_idx" ON "anonymous_messages"("conversationId", "createdAt");

-- CreateIndex
CREATE INDEX "anonymous_funnel_events_eventType_createdAt_idx" ON "anonymous_funnel_events"("eventType", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "anonymous_funnel_events_sessionId_eventType_key" ON "anonymous_funnel_events"("sessionId", "eventType");

-- AddForeignKey
ALTER TABLE "anonymous_sessions" ADD CONSTRAINT "anonymous_sessions_identityId_fkey" FOREIGN KEY ("identityId") REFERENCES "anonymous_identities"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "anonymous_conversations" ADD CONSTRAINT "anonymous_conversations_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "anonymous_sessions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "anonymous_messages" ADD CONSTRAINT "anonymous_messages_conversationId_fkey" FOREIGN KEY ("conversationId") REFERENCES "anonymous_conversations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "anonymous_funnel_events" ADD CONSTRAINT "anonymous_funnel_events_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "anonymous_sessions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

