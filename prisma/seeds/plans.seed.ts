import { PrismaPg } from '@prisma/adapter-pg'
import { PrismaClient } from '@prisma/client'

const adapter = new PrismaPg({ connectionString: process.env['DATABASE_URL'] })
const prisma = new PrismaClient({ adapter })

const plans = [
  {
    name: 'رایگان',
    priceMonthly: 0,
    dailyFreeTokens: 5_000,
    monthlyTotalTokens: 0,
    allowedModels: ['openai/gpt-5-nano'],
    features: {
      chatHistory: true,
      maxConversations: 10,
      support: 'community',
    },
    isActive: true,
    sortOrder: 0,
    rollingWindowLimit: 5,
    rollingWindowHours: 3,
  },
  {
    name: 'اکو',
    priceMonthly: 199_000, // تومان
    dailyFreeTokens: 0,
    monthlyTotalTokens: 500_000,
    allowedModels: [
      'openai/gpt-4o-mini',
      'openai/gpt-5-nano',
      'openai/gpt-5-mini',
      'google/gemini-2.5-flash',
      'google/gemini-3.1-flash-lite',
      'google/gemini-2.5-flash-lite',
    ],
    features: {
      chatHistory: true,
      maxConversations: 100,
      support: 'email',
      fileUpload: false,
    },
    isActive: true,
    sortOrder: 1,
    rollingWindowLimit: 10,
    rollingWindowHours: 3,
  },
  {
    name: 'پلاس',
    priceMonthly: 499_000, // تومان
    dailyFreeTokens: 0,
    monthlyTotalTokens: 2_000_000,
    allowedModels: [
      'openai/gpt-4o-mini',
      'openai/gpt-5-nano',
      'openai/gpt-5-mini',
      'openai/gpt-5.4-nano',
      'openai/gpt-5.4-mini',
      'openai/gpt-5.1-codex-mini',
      'openai/o4-mini',
      'openai/o4-mini-high',
      'openai/gpt-4.1-mini',
      'google/gemini-2.5-flash',
      'google/gemini-2.5-flash-lite',
      'google/gemini-3.1-flash-lite',
      'google/gemini-3-flash-preview',
      'x-ai/grok-4.3',
      'x-ai/grok-4.20',
      'deepseek/deepseek-v4-pro',
      'deepseek/deepseek-v4-flash',
    ],
    features: {
      chatHistory: true,
      maxConversations: -1, // unlimited
      support: 'priority',
      fileUpload: true,
      apiAccess: true,
    },
    isActive: true,
    sortOrder: 2,
    rollingWindowLimit: 20,
    rollingWindowHours: 3,
  },
]

// مسیریابی مدل بر اساس درصد مصرف بودجه‌ی روزانه — رایگان استپ ندارد (فقط یک مدل دارد، لازم نیست)
const routingSteps: Record<string, { order: number; thresholdPct: number; models: string[] }[]> = {
  اکو: [
    { order: 1, thresholdPct: 60, models: ['openai/gpt-5-mini', 'google/gemini-2.5-flash'] },
    { order: 2, thresholdPct: 90, models: ['openai/gpt-5-nano', 'google/gemini-3.1-flash-lite', 'google/gemini-2.5-flash-lite'] },
    { order: 3, thresholdPct: 100, models: ['openai/gpt-5-nano'] },
  ],
  پلاس: [
    {
      order: 1,
      thresholdPct: 70,
      models: [
        'openai/gpt-5.4-mini',
        'openai/gpt-5.1-codex-mini',
        'openai/o4-mini',
        'openai/o4-mini-high',
        'google/gemini-3-flash-preview',
        'google/gemini-2.5-flash',
        'x-ai/grok-4.3',
        'x-ai/grok-4.20',
      ],
    },
    {
      order: 2,
      thresholdPct: 90,
      models: ['openai/gpt-5.4-nano', 'openai/gpt-5-mini', 'openai/gpt-4.1-mini', 'google/gemini-3.1-flash-lite'],
    },
    {
      order: 3,
      thresholdPct: 100,
      models: [
        'openai/gpt-5-nano',
        'openai/gpt-4o-mini',
        'google/gemini-2.5-flash-lite',
        'deepseek/deepseek-v4-pro',
        'deepseek/deepseek-v4-flash',
      ],
    },
  ],
}

async function main() {
  console.log('Seeding plans...')

  for (const plan of plans) {
    await prisma.plan.upsert({
      where: { name: plan.name },
      update: {},   // never overwrite admin edits — only create if missing
      create: plan,
    })
    console.log(`  ✓ ${plan.name}`)
  }

  console.log('Seeding routing steps...')
  for (const [planName, steps] of Object.entries(routingSteps)) {
    const plan = await prisma.plan.findUnique({ where: { name: planName } })
    if (!plan) continue
    for (const step of steps) {
      await prisma.planRoutingStep.upsert({
        where: { planId_order: { planId: plan.id, order: step.order } },
        update: {}, // never overwrite admin edits — only create if missing
        create: { planId: plan.id, order: step.order, thresholdPct: step.thresholdPct, models: step.models },
      })
    }
    console.log(`  ✓ ${planName} (${steps.length} steps)`)
  }

  console.log('Done.')
}

main()
  .catch(e => {
    console.error(e)
    process.exit(1)
  })
  .finally(() => prisma.$disconnect())
