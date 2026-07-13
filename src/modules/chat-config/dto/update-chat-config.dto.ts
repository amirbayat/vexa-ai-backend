import { IsInt, IsOptional, IsString, Max, Min } from 'class-validator'

export class UpdateChatConfigDto {
  @IsOptional()
  @IsString()
  globalContextMd?: string

  @IsOptional()
  @IsInt()
  @Min(100)
  @Max(100_000)
  summaryTriggerTokens?: number

  @IsOptional()
  @IsInt()
  @Min(50)
  @Max(4096)
  summaryMaxTokens?: number
}
