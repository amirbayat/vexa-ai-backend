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
exports.ListConversationsDto = void 0;
const class_transformer_1 = require("class-transformer");
const class_validator_1 = require("class-validator");
const fa_1 = require("../../../i18n/fa");
class ListConversationsDto {
    cursor;
    limit = 20;
}
exports.ListConversationsDto = ListConversationsDto;
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)({ message: fa_1.fa.validation.required }),
    __metadata("design:type", String)
], ListConversationsDto.prototype, "cursor", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_transformer_1.Type)(() => Number),
    (0, class_validator_1.IsInt)({ message: fa_1.fa.validation.mustBeNumber }),
    (0, class_validator_1.Min)(1, { message: fa_1.fa.validation.numberPositive }),
    (0, class_validator_1.Max)(50, { message: fa_1.fa.validation.stringTooLong }),
    __metadata("design:type", Number)
], ListConversationsDto.prototype, "limit", void 0);
//# sourceMappingURL=list-conversations.dto.js.map