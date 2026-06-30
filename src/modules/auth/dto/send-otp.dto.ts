import { IsString, Matches } from 'class-validator'
import { fa } from '../../../i18n/fa'

export class SendOtpDto {
  @IsString({ message: fa.validation.required })
  @Matches(/^(\+98|0)?9[0-9]{9}$/, { message: fa.validation.phoneInvalid })
  phone: string
}
