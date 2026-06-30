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
exports.CreateConversationDto = void 0;
const class_validator_1 = require("class-validator");
const fa_1 = require("../../../i18n/fa");
class CreateConversationDto {
    model;
    title;
    systemPrompt;
}
exports.CreateConversationDto = CreateConversationDto;
__decorate([
    (0, class_validator_1.IsString)({ message: fa_1.fa.validation.required }),
    (0, class_validator_1.MaxLength)(50, { message: fa_1.fa.validation.stringTooLong }),
    __metadata("design:type", String)
], CreateConversationDto.prototype, "model", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)({ message: fa_1.fa.validation.required }),
    (0, class_validator_1.MaxLength)(200, { message: fa_1.fa.validation.stringTooLong }),
    __metadata("design:type", String)
], CreateConversationDto.prototype, "title", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)({ message: fa_1.fa.validation.required }),
    (0, class_validator_1.MaxLength)(2000, { message: fa_1.fa.validation.stringTooLong }),
    __metadata("design:type", String)
], CreateConversationDto.prototype, "systemPrompt", void 0);
//# sourceMappingURL=create-conversation.dto.js.map