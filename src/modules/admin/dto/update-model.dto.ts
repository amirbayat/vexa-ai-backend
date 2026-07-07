import { Type } from 'class-transformer'
import { IsBoolean, IsIn, IsNumber, IsOptional, IsString, Min } from 'class-validator'
import { MODEL_TIERS, TOKENIZER_FAMILIES } from './create-model.dto'

export class UpdateModelDto {
  @IsOptional()
  @IsString()
  name?: string

  @IsOptional()
  @IsString()
  displayName?: string

  @IsOptional()
  @IsString()
  provider?: string

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  inputPricePerM?: number

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  outputPricePerM?: number

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
