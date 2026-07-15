import { BadRequestException } from '@nestjs/common'
import { fa } from '../../i18n/fa'

// docs/PRD-chat-images.md بخش ۵.۱ — تا الان StreamMessageDto.images فقط طول آرایه را
// محدود می‌کرد؛ هیچ چک فرمت/حجم/magic-bytes ای وجود نداشت (docs/SECURITY-AUDIT.md بخش ۸).
// SVG عمداً در لیست مجاز نیست — می‌تواند محتوای غیرمنتظره حمل کند؛ فرمت‌های raster این ریسک را ندارند.
const DATA_URL_RE = /^data:image\/(png|jpe?g|webp|gif);base64,([A-Za-z0-9+/]+={0,2})$/i

function matchesMagicBytes(buffer: Buffer, ext: string): boolean {
  switch (ext) {
    case 'png':
      return buffer.subarray(0, 4).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47]))
    case 'jpg':
    case 'jpeg':
      return buffer.subarray(0, 3).equals(Buffer.from([0xff, 0xd8, 0xff]))
    case 'gif':
      return buffer.subarray(0, 4).equals(Buffer.from([0x47, 0x49, 0x46, 0x38]))
    case 'webp':
      // RIFF <4 بایت سایز> WEBP — بایت‌های ۰-۳ و ۸-۱۱ باید مطابقت داشته باشند
      return (
        buffer.subarray(0, 4).equals(Buffer.from([0x52, 0x49, 0x46, 0x46])) &&
        buffer.subarray(8, 12).equals(Buffer.from([0x57, 0x45, 0x42, 0x50]))
      )
    default:
      return false
  }
}

export function validateChatImages(
  images: string[] | undefined,
  opts: { maxCount: number; maxSizeMb: number },
): void {
  if (!images || images.length === 0) return

  if (images.length > opts.maxCount) {
    throw new BadRequestException(fa.chatImages.tooMany(opts.maxCount))
  }

  const maxBytes = opts.maxSizeMb * 1024 * 1024
  for (const image of images) {
    const match = DATA_URL_RE.exec(image)
    if (!match) throw new BadRequestException(fa.chatImages.invalidFormat)

    const ext = match[1].toLowerCase()
    let buffer: Buffer
    try {
      buffer = Buffer.from(match[2], 'base64')
    } catch {
      throw new BadRequestException(fa.chatImages.invalidFormat)
    }

    if (buffer.length === 0 || buffer.length > maxBytes) {
      throw new BadRequestException(fa.chatImages.tooLarge(opts.maxSizeMb))
    }
    if (!matchesMagicBytes(buffer, ext)) {
      throw new BadRequestException(fa.chatImages.contentMismatch)
    }
  }
}
