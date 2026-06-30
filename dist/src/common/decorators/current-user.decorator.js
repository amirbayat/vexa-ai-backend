"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CurrentUser = exports.JwtPayload = void 0;
const common_1 = require("@nestjs/common");
class JwtPayload {
    sub;
    phone;
    role;
}
exports.JwtPayload = JwtPayload;
exports.CurrentUser = (0, common_1.createParamDecorator)((_data, ctx) => {
    const request = ctx.switchToHttp().getRequest();
    return request.user;
});
//# sourceMappingURL=current-user.decorator.js.map