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
exports.TopicService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../../prisma/prisma.service");
const redis_service_1 = require("../../redis/redis.service");
const CACHE_KEY = 'topics:active';
const CACHE_TTL = 300;
let TopicService = class TopicService {
    prisma;
    redis;
    constructor(prisma, redis) {
        this.prisma = prisma;
        this.redis = redis;
    }
    async classify(text) {
        if (!text)
            return null;
        const topics = await this.getActiveTopicRules();
        if (!topics.length)
            return null;
        const lower = text.toLowerCase();
        let best = null;
        for (const topic of topics) {
            const hits = topic.keywords.reduce((n, kw) => (kw && lower.includes(kw.toLowerCase()) ? n + 1 : n), 0);
            if (hits > 0 && (!best || hits > best.hits))
                best = { id: topic.id, hits };
        }
        return best?.id ?? null;
    }
    async list() {
        return this.prisma.topic.findMany({ orderBy: { sortOrder: 'asc' } });
    }
    async create(data) {
        const topic = await this.prisma.topic.create({ data });
        await this.invalidateCache();
        return topic;
    }
    async update(id, data) {
        const topic = await this.prisma.topic.update({ where: { id }, data });
        await this.invalidateCache();
        return topic;
    }
    async remove(id) {
        await this.prisma.topic.delete({ where: { id } });
        await this.invalidateCache();
    }
    async invalidateCache() {
        await this.redis.del(CACHE_KEY);
    }
    async getActiveTopicRules() {
        const cached = await this.redis.get(CACHE_KEY);
        if (cached)
            return JSON.parse(cached);
        const topics = await this.prisma.topic.findMany({
            where: { isActive: true },
            orderBy: { sortOrder: 'asc' },
            select: { id: true, keywords: true },
        });
        const rules = topics.map((t) => ({
            id: t.id,
            keywords: t.keywords,
        }));
        await this.redis.set(CACHE_KEY, JSON.stringify(rules), 'EX', CACHE_TTL);
        return rules;
    }
};
exports.TopicService = TopicService;
exports.TopicService = TopicService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        redis_service_1.RedisService])
], TopicService);
//# sourceMappingURL=topic.service.js.map