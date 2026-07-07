import { PrismaPg } from '@prisma/adapter-pg'
import { PrismaClient } from '@prisma/client'

const adapter = new PrismaPg({ connectionString: process.env['DATABASE_URL'] })
const prisma = new PrismaClient({ adapter })

// نقطه‌ی شروع — کاملاً قابل ویرایش در پنل ادمین (docs/PRD-global-budget-gateway.md بخش ۱۷.۶)
const SEGMENTS = [
  {
    label: 'کم‌مصرف',
    minMessagesPerDay: null,
    maxMessagesPerDay: 5,
    minTokensPerDay: null,
    maxTokensPerDay: null,
    color: '#94A3B8',
    sortOrder: 0,
  },
  {
    label: 'متوسط',
    minMessagesPerDay: 6,
    maxMessagesPerDay: 20,
    minTokensPerDay: null,
    maxTokensPerDay: null,
    color: '#0EA5E9',
    sortOrder: 1,
  },
  {
    label: 'پرمصرف حرفه‌ای',
    minMessagesPerDay: 21,
    maxMessagesPerDay: null,
    minTokensPerDay: null,
    maxTokensPerDay: null,
    color: '#F59E0B',
    sortOrder: 2,
  },
]

async function main() {
  for (const segment of SEGMENTS) {
    const existing = await prisma.userSegment.findFirst({ where: { label: segment.label } })
    if (existing) {
      console.log(`↷ segment already exists: ${segment.label}`)
      continue
    }
    await prisma.userSegment.create({ data: segment })
    console.log(`✓ segment: ${segment.label}`)
  }
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect())
