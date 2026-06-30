import { IsString, IsUUID } from 'class-validator'
import { fa } from '../../../i18n/fa'

export class InitiatePaymentDto {
  @IsString({ message: fa.validation.required })
  @IsUUID('4', { message: fa.validation.required })
  planId: string
}
