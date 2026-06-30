import { Process, Processor } from '@nestjs/bull'
import { Logger } from '@nestjs/common'
import { PrismaService } from '../../prisma/prisma.service'
import { RedisService } from '../../redis/redis.service'

@Processor('token-flush')
export class TokenFlushProcessor {
  private readonly logger = new Logger(TokenFlushProcessor.name)

  constructor(
    private readonly redis: RedisService,
    private readonly prisma: PrismaService,
  ) {}

  @Process('flush')
  async handleFlush() {
    const today = new Date().toISOString().slice(0, 10)
    const keys = await this.scanKeys(`token:free:*:${today}`)

    if (!keys.length) return

    const values = await Promise.all(keys.map(k => this.redis.get(k)))

    const upserts = keys.map((key, i) => {
      const userId = key.split(':')[2]
      const freeTokensUsed = Number(values[i]) || 0
      const date = new Date(today)

      return this.prisma.dailyUsage.upsert({
        where: { userId_date: { userId, date } },
        create: { userId, date, freeTokensUsed },
        update: { freeTokensUsed },
      })
    })

    await Promise.all(upserts)
    this.logger.log(`Token flush: synced ${keys.length} users for ${today}`)
  }

  private scanKeys(pattern: string): Promise<string[]> {
    return new Promise((resolve, reject) => {
      const keys: string[] = []
      const stream = this.redis.scanStream({ match: pattern, count: 100 })
      stream.on('data', (batch: string[]) => keys.push(...batch))
      stream.on('end', () => resolve(keys))
      stream.on('error', reject)
    })
  }
}
