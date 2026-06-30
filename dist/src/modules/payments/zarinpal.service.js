"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ZarinpalService = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const fa_1 = require("../../i18n/fa");
let ZarinpalService = class ZarinpalService {
    config;
    merchantId;
    baseUrl = 'https://api.zarinpal.com/pg/v4/payment';
    gatewayUrl = 'https://www.zarinpal.com/pg/StartPay';
    constructor(config) {
        this.config = config;
        this.merchantId = this.config.get('ZARINPAL_MERCHANT_ID');
    }
    async requestPayment(amount, description, callbackUrl) {
        const res = await fetch(`${this.baseUrl}/request.json`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
            body: JSON.stringify({
                merchant_id: this.merchantId,
                amount,
                description,
                callback_url: callbackUrl,
            }),
        });
        const json = (await res.json());
        if (!res.ok || json.data?.code !== 100) {
            throw new common_1.InternalServerErrorException(fa_1.fa.payment.gatewayError);
        }
        return {
            authority: json.data.authority,
            paymentUrl: `${this.gatewayUrl}/${json.data.authority}`,
        };
    }
    async verifyPayment(amount, authority) {
        const res = await fetch(`${this.baseUrl}/verify.json`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
            body: JSON.stringify({
                merchant_id: this.merchantId,
                amount,
                authority,
            }),
        });
        const json = (await res.json());
        if (!res.ok || (json.data?.code !== 100 && json.data?.code !== 101)) {
            return { success: false, refId: null };
        }
        return { success: true, refId: String(json.data.ref_id) };
    }
};
exports.ZarinpalService = ZarinpalService;
exports.ZarinpalService = ZarinpalService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [config_1.ConfigService])
], ZarinpalService);
//# sourceMappingURL=zarinpal.service.js.map