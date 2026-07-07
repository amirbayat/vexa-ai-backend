"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.UsageAnalyticsModule = void 0;
const common_1 = require("@nestjs/common");
const usage_analytics_service_1 = require("./usage-analytics.service");
const topic_service_1 = require("./topic.service");
const usage_analytics_controller_1 = require("./usage-analytics.controller");
let UsageAnalyticsModule = class UsageAnalyticsModule {
};
exports.UsageAnalyticsModule = UsageAnalyticsModule;
exports.UsageAnalyticsModule = UsageAnalyticsModule = __decorate([
    (0, common_1.Module)({
        controllers: [usage_analytics_controller_1.UsageAnalyticsController, usage_analytics_controller_1.TopicController],
        providers: [usage_analytics_service_1.UsageAnalyticsService, topic_service_1.TopicService],
        exports: [usage_analytics_service_1.UsageAnalyticsService, topic_service_1.TopicService],
    })
], UsageAnalyticsModule);
//# sourceMappingURL=usage-analytics.module.js.map