import { IsBoolean, IsIn, IsInt, IsOptional, IsString, Min, MinLength } from 'class-validator'

export const LEAD_FOLLOW_UP_STATUSES = ['NEW', 'CONTACTED', 'CONVERTED', 'DECLINED'] as const

export class UpdateSalesBotConfigDto {
  @IsOptional()
  @IsString()
  @MinLength(1)
  contextMd?: string

  @IsOptional()
  @IsString()
  model?: string

  @IsOptional()
  @IsString()
  embeddingModel?: string

  @IsOptional()
  @IsInt()
  @Min(1)
  maxMessages?: number

  @IsOptional()
  @IsBoolean()
  discountEnabled?: boolean

  @IsOptional()
  @IsInt()
  @Min(1)
  discountMinMessages?: number

  @IsOptional()
  @IsString()
  @MinLength(1)
  discountPromptText?: string
}

export class UpdateLeadFollowUpDto {
  @IsIn(LEAD_FOLLOW_UP_STATUSES)
  followUpStatus!: (typeof LEAD_FOLLOW_UP_STATUSES)[number]
}

export class SendLeadSmsDto {
  @IsString()
  @MinLength(1)
  message!: string
}
