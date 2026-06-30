import { IsOptional, IsString, MaxLength } from 'class-validator'
import { fa } from '../../../i18n/fa'

export class StreamMessageDto {
  @IsString({ message: fa.validation.required })
  @MaxLength(10_000, { message: fa.validation.stringTooLong })
  content: string

  @IsOptional()
  @IsString({ message: fa.validation.required })
  @MaxLength(50, { message: fa.validation.stringTooLong })
  model?: string
}
