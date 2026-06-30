import { IsString, Length, Matches } from 'class-validator'
import { fa } from '../../../i18n/fa'

export class VerifyOtpDto {
  @IsString({ message: fa.validation.required })
  @Matches(/^(\+98|0)?9[0-9]{9}$/, { message: fa.validation.phoneInvalid })
  phone: string

  @IsString({ message: fa.validation.required })
  @Length(6, 6, { message: fa.validation.otpLength })
  @Matches(/^[0-9]{6}$/, { message: fa.validation.otpDigitsOnly })
  code: string
}
