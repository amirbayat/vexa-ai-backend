import { IsBoolean, IsOptional, IsString, IsArray, ArrayMaxSize, MaxLength } from 'class-validator'
import { fa } from '../../../i18n/fa'

export class StreamMessageDto {
  @IsString({ message: fa.validation.required })
  @MaxLength(10_000, { message: fa.validation.stringTooLong })
  content: string

  @IsOptional()
  @IsString({ message: fa.validation.required })
  @MaxLength(50, { message: fa.validation.stringTooLong })
  model?: string

  @IsOptional()
  @IsArray()
  @ArrayMaxSize(5)
  @IsString({ each: true })
  images?: string[]

  // docs/PRD-chat-images.md بخش ۵.۵ — حالت صریح تولید عکس؛ content همان prompt تولید است.
  // وقتی true است، model باید یک مدل supportsImageGen مشخص باشد (نه 'optimal')
  @IsOptional()
  @IsBoolean({ message: fa.validation.mustBeBoolean })
  generateImage?: boolean
}
