import { Transform } from 'class-transformer'
import { IsIn, IsOptional, IsString, IsUUID } from 'class-validator'
import { PaymentProvider } from '@prisma/client'
import { fa } from '../../../i18n/fa'
import { PAYMENT_GATEWAY_NAMES } from '../gateways/payment-gateway.interface'

export class InitiatePaymentDto {
  @IsString({ message: fa.validation.required })
  @IsUUID('4', { message: fa.validation.required })
  planId: string

  // فرانت‌اند نام درگاه را lowercase می‌فرستد (مطابق PAYMENT_GATEWAYS)؛ اینجا با enum مقداری Prisma (uppercase) یکی می‌شود
  @IsOptional()
  @Transform(({ value }) => (typeof value === 'string' ? value.toUpperCase() : value))
  @IsIn(PAYMENT_GATEWAY_NAMES, { message: fa.payment.gatewayNotEnabled })
  gateway?: PaymentProvider

  // docs/PRD-growth-traction-features.md بخش ۵.۲
  @IsOptional()
  @IsString({ message: fa.validation.required })
  discountCode?: string
}
