import { Injectable, InternalServerErrorException } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { PaymentProvider } from '@prisma/client'
import { fa } from '../../../i18n/fa'
import {
  CallbackQuery,
  CreatePaymentParams,
  CreatePaymentResult,
  PaymentGateway,
  VerifyPaymentParams,
  VerifyPaymentResult,
} from './payment-gateway.interface'

interface VandarSendResponse {
  status: number
  token?: string
  message?: string
}

interface VandarVerifyResponse {
  status: number
  transId?: number
  message?: string
}

@Injectable()
export class VandarGateway implements PaymentGateway {
  readonly name = PaymentProvider.VANDAR

  private readonly apiKey: string
  private readonly baseUrl = 'https://ipg.vandar.io/api/v4'
  private readonly gatewayUrl = 'https://ipg.vandar.io/v4'

  constructor(private readonly config: ConfigService) {
    this.apiKey = this.config.get<string>('VANDAR_API_KEY')!
  }

  async createPayment({ amount, description, callbackUrl, mobile }: CreatePaymentParams): Promise<CreatePaymentResult> {
    const res = await fetch(`${this.baseUrl}/send`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify({
        api_key: this.apiKey,
        amount,
        callback_url: callbackUrl,
        description,
        ...(mobile ? { mobile_number: mobile } : {}),
      }),
    })

    const json = (await res.json()) as VandarSendResponse

    if (!res.ok || json.status !== 1 || !json.token) {
      throw new InternalServerErrorException(fa.payment.gatewayError)
    }

    return {
      providerRef: json.token,
      paymentUrl: `${this.gatewayUrl}/${json.token}`,
    }
  }

  // نکته: بر خلاف زرین‌پال، وندار مبلغ را در verify نمی‌گیرد (فقط api_key + token)
  async verifyPayment({ providerRef }: VerifyPaymentParams): Promise<VerifyPaymentResult> {
    const res = await fetch(`${this.baseUrl}/verify`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify({
        api_key: this.apiKey,
        token: providerRef,
      }),
    })

    const json = (await res.json()) as VandarVerifyResponse

    if (!res.ok || json.status !== 1) {
      return { success: false, refId: null }
    }

    return { success: true, refId: String(json.transId) }
  }

  parseCallback(query: Record<string, string>): CallbackQuery {
    return { providerRef: query.token, success: query.payment_status === 'OK' }
  }
}
