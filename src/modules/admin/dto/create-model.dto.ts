import { Type } from 'class-transformer'
import { IsBoolean, IsIn, IsNumber, IsOptional, IsString, Min } from 'class-validator'

export const MODEL_TIERS = ['SIMPLE', 'MEDIUM', 'COMPLEX'] as const
export const TOKENIZER_FAMILIES = ['o200k_base', 'cl100k_base', 'approximate'] as const

export class CreateModelDto {
  @IsString()
  name!: string

  @IsString()
  displayName!: string

  @IsString()
  provider!: string

  @Type(() => Number)
  @IsNumber()
  @Min(0)
  inputPricePerM!: number

  @Type(() => Number)
  @IsNumber()
  @Min(0)
  outputPricePerM!: number

  @IsOptional()
  @IsBoolean()
  supportsVision?: boolean

  @IsOptional()
  @IsBoolean()
  isActive?: boolean

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  sortOrder?: number

  @IsOptional()
  @IsIn(MODEL_TIERS)
  tier?: (typeof MODEL_TIERS)[number]

  @IsOptional()
  @IsIn(TOKENIZER_FAMILIES)
  tokenizerFamily?: (typeof TOKENIZER_FAMILIES)[number]

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  avgCharsPerToken?: number
}
