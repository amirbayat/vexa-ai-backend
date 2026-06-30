import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { createOpenAICompatible } from '@ai-sdk/openai-compatible'
import { streamText } from 'ai'
import type { ModelMessage } from 'ai'
import { PrismaService } from '../../prisma/prisma.service'
import { TokenService } from '../usage/token.service'
import { fa } from '../../i18n/fa'
import type { Response } from 'express'
import { StreamMessageDto } from './dto/stream-message.dto'

@Injectable()
export class ChatService {
  private readonly provider

  constructor(
    private readonly prisma: PrismaService,
    private readonly tokenService: TokenService,
    private readonly config: ConfigService,
  ) {
    this.provider = createOpenAICompatible({
      name: 'liara',
      baseURL: this.config.get<string>('LIARA_AI_BASE_URL')!,
      apiKey: this.config.get<string>('LIARA_API_KEY')!,
    })
  }

  async streamChat(conversationId: string, userId: string, dto: StreamMessageDto, res: Response) {
    res.setHeader('Content-Type', 'text/event-stream')
    res.setHeader('Cache-Control', 'no-cache')
    res.setHeader('Connection', 'keep-alive')
    res.setHeader('X-Accel-Buffering', 'no')
    res.flushHeaders()

    try {
      const conversation = await this.prisma.conversation.findUnique({
        where: { id: conversationId },
        select: { userId: true, model: true, systemPrompt: true },
      })

      if (!conversation) throw new NotFoundException(fa.conversations.notFound)
      if (conversation.userId !== userId) throw new ForbiddenException(fa.conversations.forbidden)

      const modelId = dto.model ?? conversation.model
      const plan = await this.tokenService.getCachedPlan(userId)

      if (!(plan.allowedModels as string[]).includes(modelId)) {
        throw new ForbiddenException(fa.chat.modelNotAllowed)
      }

      const quota = await this.tokenService.checkQuota(userId)

      await this.prisma.message.create({
        data: { conversationId, role: 'USER', content: dto.content },
      })

      const recentMessages = await this.prisma.message.findMany({
        where: { conversationId },
        orderBy: { createdAt: 'asc' },
        take: 20,
        select: { role: true, content: true },
      })

      const coreMessages: ModelMessage[] = recentMessages.map(m => ({
        role: m.role === 'USER' ? 'user' : m.role === 'ASSISTANT' ? 'assistant' : 'system',
        content: m.content,
      }))

      const result = streamText({
        model: this.provider(modelId),
        system: conversation.systemPrompt ?? undefined,
        messages: coreMessages,
        maxOutputTokens: Math.min(quota.remaining, 4096),
      })

      let fullContent = ''
      for await (const chunk of result.textStream) {
        fullContent += chunk
        res.write(`data: ${JSON.stringify({ chunk })}\n\n`)
      }

      const usage = await result.usage
      const tokensUsed = usage.totalTokens ?? 0

      await this.prisma.message.create({
        data: {
          conversationId,
          role: 'ASSISTANT',
          content: fullContent,
          tokensInput: usage.inputTokens ?? 0,
          tokensOutput: usage.outputTokens ?? 0,
          model: modelId,
        },
      })

      await Promise.all([
        this.tokenService.increment(userId, tokensUsed, quota.source),
        this.prisma.conversation.update({
          where: { id: conversationId },
          data: {
            totalTokens: { increment: tokensUsed },
            lastMessageAt: new Date(),
          },
        }),
      ])

      res.write(`data: [DONE]\n\n`)
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : fa.chat.streamError
      res.write(`data: ${JSON.stringify({ error: message })}\n\n`)
    } finally {
      res.end()
    }
  }
}
