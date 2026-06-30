"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ChatService = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const openai_compatible_1 = require("@ai-sdk/openai-compatible");
const ai_1 = require("ai");
const prisma_service_1 = require("../../prisma/prisma.service");
const token_service_1 = require("../usage/token.service");
const fa_1 = require("../../i18n/fa");
let ChatService = class ChatService {
    prisma;
    tokenService;
    config;
    provider;
    constructor(prisma, tokenService, config) {
        this.prisma = prisma;
        this.tokenService = tokenService;
        this.config = config;
        this.provider = (0, openai_compatible_1.createOpenAICompatible)({
            name: 'liara',
            baseURL: this.config.get('LIARA_AI_BASE_URL'),
            apiKey: this.config.get('LIARA_API_KEY'),
        });
    }
    async streamChat(conversationId, userId, dto, res) {
        res.setHeader('Content-Type', 'text/event-stream');
        res.setHeader('Cache-Control', 'no-cache');
        res.setHeader('Connection', 'keep-alive');
        res.setHeader('X-Accel-Buffering', 'no');
        res.flushHeaders();
        try {
            const conversation = await this.prisma.conversation.findUnique({
                where: { id: conversationId },
                select: { userId: true, model: true, systemPrompt: true },
            });
            if (!conversation)
                throw new common_1.NotFoundException(fa_1.fa.conversations.notFound);
            if (conversation.userId !== userId)
                throw new common_1.ForbiddenException(fa_1.fa.conversations.forbidden);
            const modelId = dto.model ?? conversation.model;
            const plan = await this.tokenService.getCachedPlan(userId);
            if (!plan.allowedModels.includes(modelId)) {
                throw new common_1.ForbiddenException(fa_1.fa.chat.modelNotAllowed);
            }
            const quota = await this.tokenService.checkQuota(userId);
            await this.prisma.message.create({
                data: { conversationId, role: 'USER', content: dto.content },
            });
            const recentMessages = await this.prisma.message.findMany({
                where: { conversationId },
                orderBy: { createdAt: 'asc' },
                take: 20,
                select: { role: true, content: true },
            });
            const coreMessages = recentMessages.map(m => ({
                role: m.role === 'USER' ? 'user' : m.role === 'ASSISTANT' ? 'assistant' : 'system',
                content: m.content,
            }));
            const result = (0, ai_1.streamText)({
                model: this.provider(modelId),
                system: conversation.systemPrompt ?? undefined,
                messages: coreMessages,
                maxOutputTokens: Math.min(quota.remaining, 4096),
            });
            let fullContent = '';
            for await (const chunk of result.textStream) {
                fullContent += chunk;
                res.write(`data: ${JSON.stringify({ chunk })}\n\n`);
            }
            const usage = await result.usage;
            const tokensUsed = usage.totalTokens ?? 0;
            await this.prisma.message.create({
                data: {
                    conversationId,
                    role: 'ASSISTANT',
                    content: fullContent,
                    tokensInput: usage.inputTokens ?? 0,
                    tokensOutput: usage.outputTokens ?? 0,
                    model: modelId,
                },
            });
            await Promise.all([
                this.tokenService.increment(userId, tokensUsed, quota.source),
                this.prisma.conversation.update({
                    where: { id: conversationId },
                    data: {
                        totalTokens: { increment: tokensUsed },
                        lastMessageAt: new Date(),
                    },
                }),
            ]);
            res.write(`data: [DONE]\n\n`);
        }
        catch (err) {
            const message = err instanceof Error ? err.message : fa_1.fa.chat.streamError;
            res.write(`data: ${JSON.stringify({ error: message })}\n\n`);
        }
        finally {
            res.end();
        }
    }
};
exports.ChatService = ChatService;
exports.ChatService = ChatService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        token_service_1.TokenService,
        config_1.ConfigService])
], ChatService);
//# sourceMappingURL=chat.service.js.map