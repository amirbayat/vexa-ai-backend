import { PrismaPg } from '@prisma/adapter-pg'
import { PrismaClient } from '@prisma/client'

const adapter = new PrismaPg({ connectionString: process.env['DATABASE_URL'] })
const prisma = new PrismaClient({ adapter })

const TOPICS = [
  {
    name: 'برنامه‌نویسی',
    keywords: [
      'کد', 'دیباگ', 'تابع', 'کلاس', 'پایتون', 'جاوااسکریپت', 'برنامه‌نویسی',
      'function', 'bug', 'error', 'python', 'javascript', 'react', 'sql', 'الگوریتم',
    ],
    color: '#4F46E5',
    sortOrder: 0,
  },
  {
    name: 'ترجمه',
    keywords: ['ترجمه کن', 'ترجمه', 'translate', 'به انگلیسی', 'به فارسی', 'معنی این جمله', 'معنی کلمه'],
    color: '#0EA5E9',
    sortOrder: 1,
  },
  {
    name: 'نگارش',
    keywords: ['بازنویسی', 'ویرایش متن', 'ایمیل بنویس', 'مقاله بنویس', 'متن رسمی', 'کپشن', 'پست اینستاگرام'],
    color: '#10B981',
    sortOrder: 2,
  },
  {
    name: 'پزشکی',
    keywords: ['دارو', 'بیماری', 'علائم', 'دکتر', 'پزشک', 'درمان', 'عارضه'],
    color: '#EF4444',
    sortOrder: 3,
  },
  {
    name: 'ریاضی',
    keywords: ['معادله', 'انتگرال', 'مشتق', 'احتمال', 'حل کن', 'فرمول', 'هندسه'],
    color: '#F59E0B',
    sortOrder: 4,
  },
]

async function main() {
  for (const topic of TOPICS) {
    await prisma.topic.upsert({
      where: { name: topic.name },
      create: topic,
      update: {}, // admin changes survive restarts
    })
    console.log(`✓ topic: ${topic.name}`)
  }
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect())
