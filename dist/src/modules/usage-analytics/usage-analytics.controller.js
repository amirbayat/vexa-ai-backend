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
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.TopicController = exports.UsageAnalyticsController = void 0;
const common_1 = require("@nestjs/common");
const jwt_guard_1 = require("../../common/guards/jwt.guard");
const admin_guard_1 = require("../../common/guards/admin.guard");
const usage_analytics_service_1 = require("./usage-analytics.service");
const topic_service_1 = require("./topic.service");
let UsageAnalyticsController = class UsageAnalyticsController {
    analytics;
    topics;
    constructor(analytics, topics) {
        this.analytics = analytics;
        this.topics = topics;
    }
    getOverview(from, to, compareTo) {
        return this.analytics.getOverview((0, usage_analytics_service_1.parseDateRange)(from, to), compareTo === 'previous_period');
    }
    getTimeseries(from, to, granularity) {
        return this.analytics.getTimeseries((0, usage_analytics_service_1.parseDateRange)(from, to), granularity ?? 'day');
    }
    getModels(from, to) {
        return this.analytics.getModelBreakdown((0, usage_analytics_service_1.parseDateRange)(from, to));
    }
    getTopicsBreakdown(from, to) {
        return this.analytics.getTopicBreakdown((0, usage_analytics_service_1.parseDateRange)(from, to));
    }
    getLimitHits(from, to) {
        return this.analytics.getLimitHits((0, usage_analytics_service_1.parseDateRange)(from, to));
    }
    getUsers(from, to, segment) {
        return this.analytics.getUsers((0, usage_analytics_service_1.parseDateRange)(from, to), segment);
    }
    async exportUsers(res, from, to, segment) {
        const csv = await this.analytics.exportUsersCsv((0, usage_analytics_service_1.parseDateRange)(from, to), segment);
        res.setHeader('Content-Type', 'text/csv; charset=utf-8');
        res.setHeader('Content-Disposition', 'attachment; filename="usage-analytics.csv"');
        res.send('﻿' + csv);
    }
    listSegments() {
        return this.analytics.listSegments();
    }
    getSegmentBreakdown(from, to, compareTo) {
        return this.analytics.getSegmentBreakdown((0, usage_analytics_service_1.parseDateRange)(from, to), compareTo === 'previous_period');
    }
    createSegment(body) {
        return this.analytics.createSegment(body);
    }
    updateSegment(id, body) {
        return this.analytics.updateSegment(id, body);
    }
    deleteSegment(id) {
        return this.analytics.deleteSegment(id);
    }
};
exports.UsageAnalyticsController = UsageAnalyticsController;
__decorate([
    (0, common_1.Get)('overview'),
    __param(0, (0, common_1.Query)('from')),
    __param(1, (0, common_1.Query)('to')),
    __param(2, (0, common_1.Query)('compareTo')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, String]),
    __metadata("design:returntype", void 0)
], UsageAnalyticsController.prototype, "getOverview", null);
__decorate([
    (0, common_1.Get)('timeseries'),
    __param(0, (0, common_1.Query)('from')),
    __param(1, (0, common_1.Query)('to')),
    __param(2, (0, common_1.Query)('granularity')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, String]),
    __metadata("design:returntype", void 0)
], UsageAnalyticsController.prototype, "getTimeseries", null);
__decorate([
    (0, common_1.Get)('models'),
    __param(0, (0, common_1.Query)('from')),
    __param(1, (0, common_1.Query)('to')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", void 0)
], UsageAnalyticsController.prototype, "getModels", null);
__decorate([
    (0, common_1.Get)('topics'),
    __param(0, (0, common_1.Query)('from')),
    __param(1, (0, common_1.Query)('to')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", void 0)
], UsageAnalyticsController.prototype, "getTopicsBreakdown", null);
__decorate([
    (0, common_1.Get)('limit-hits'),
    __param(0, (0, common_1.Query)('from')),
    __param(1, (0, common_1.Query)('to')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", void 0)
], UsageAnalyticsController.prototype, "getLimitHits", null);
__decorate([
    (0, common_1.Get)('users'),
    __param(0, (0, common_1.Query)('from')),
    __param(1, (0, common_1.Query)('to')),
    __param(2, (0, common_1.Query)('segment')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, String]),
    __metadata("design:returntype", void 0)
], UsageAnalyticsController.prototype, "getUsers", null);
__decorate([
    (0, common_1.Get)('users/export'),
    __param(0, (0, common_1.Res)()),
    __param(1, (0, common_1.Query)('from')),
    __param(2, (0, common_1.Query)('to')),
    __param(3, (0, common_1.Query)('segment')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, String, String]),
    __metadata("design:returntype", Promise)
], UsageAnalyticsController.prototype, "exportUsers", null);
__decorate([
    (0, common_1.Get)('segments'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], UsageAnalyticsController.prototype, "listSegments", null);
__decorate([
    (0, common_1.Get)('segments/breakdown'),
    __param(0, (0, common_1.Query)('from')),
    __param(1, (0, common_1.Query)('to')),
    __param(2, (0, common_1.Query)('compareTo')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, String]),
    __metadata("design:returntype", void 0)
], UsageAnalyticsController.prototype, "getSegmentBreakdown", null);
__decorate([
    (0, common_1.Post)('segments'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], UsageAnalyticsController.prototype, "createSegment", null);
__decorate([
    (0, common_1.Patch)('segments/:id'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", void 0)
], UsageAnalyticsController.prototype, "updateSegment", null);
__decorate([
    (0, common_1.Delete)('segments/:id'),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], UsageAnalyticsController.prototype, "deleteSegment", null);
exports.UsageAnalyticsController = UsageAnalyticsController = __decorate([
    (0, common_1.Controller)('admin/analytics'),
    (0, common_1.UseGuards)(jwt_guard_1.JwtGuard, admin_guard_1.AdminGuard),
    __metadata("design:paramtypes", [usage_analytics_service_1.UsageAnalyticsService,
        topic_service_1.TopicService])
], UsageAnalyticsController);
let TopicController = class TopicController {
    topics;
    constructor(topics) {
        this.topics = topics;
    }
    list() {
        return this.topics.list();
    }
    create(body) {
        return this.topics.create(body);
    }
    update(id, body) {
        return this.topics.update(id, body);
    }
    remove(id) {
        return this.topics.remove(id);
    }
};
exports.TopicController = TopicController;
__decorate([
    (0, common_1.Get)(),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], TopicController.prototype, "list", null);
__decorate([
    (0, common_1.Post)(),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], TopicController.prototype, "create", null);
__decorate([
    (0, common_1.Patch)(':id'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", void 0)
], TopicController.prototype, "update", null);
__decorate([
    (0, common_1.Delete)(':id'),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], TopicController.prototype, "remove", null);
exports.TopicController = TopicController = __decorate([
    (0, common_1.Controller)('admin/topics'),
    (0, common_1.UseGuards)(jwt_guard_1.JwtGuard, admin_guard_1.AdminGuard),
    __metadata("design:paramtypes", [topic_service_1.TopicService])
], TopicController);
//# sourceMappingURL=usage-analytics.controller.js.map