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
var NotificationsService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.NotificationsService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const rxjs_1 = require("rxjs");
const typeorm_2 = require("typeorm");
const notification_entity_1 = require("./entities/notification.entity");
const notification_preference_entity_1 = require("./entities/notification-preference.entity");
let NotificationsService = NotificationsService_1 = class NotificationsService {
    constructor(notifications, preferences) {
        this.notifications = notifications;
        this.preferences = preferences;
        this.logger = new common_1.Logger(NotificationsService_1.name);
        this.streams = new Map();
    }
    async listForUser(userId, limit = 20) {
        const items = await this.notifications.find({
            where: { user_id: userId, dismissed_at: (0, typeorm_2.IsNull)() },
            order: { created_at: "DESC" },
            take: limit,
        });
        const unreadCount = await this.notifications.count({
            where: { user_id: userId, read_at: (0, typeorm_2.IsNull)(), dismissed_at: (0, typeorm_2.IsNull)() },
        });
        return { items, unreadCount };
    }
    async create(input) {
        var _a, _b, _c;
        const prefs = await this.getOrCreatePreferences(input.userId);
        if (!prefs.enabled)
            return null;
        if (prefs.kinds[input.kind] === false)
            return null;
        if (input.dedupeKey) {
            const existing = await this.notifications.findOne({
                where: { user_id: input.userId, dedupe_key: input.dedupeKey },
            });
            if (existing)
                return existing;
        }
        const row = this.notifications.create({
            user_id: input.userId,
            kind: input.kind,
            severity: input.severity,
            title: input.title,
            message: input.message,
            href: (_a = input.href) !== null && _a !== void 0 ? _a : null,
            payload: (_b = input.payload) !== null && _b !== void 0 ? _b : null,
            dedupe_key: (_c = input.dedupeKey) !== null && _c !== void 0 ? _c : null,
        });
        try {
            const saved = await this.notifications.save(row);
            this.pushToStream(input.userId, {
                type: "notification",
                notification: saved,
            });
            return saved;
        }
        catch (err) {
            if (input.dedupeKey &&
                err instanceof Error &&
                err.message.includes("duplicate")) {
                return null;
            }
            throw err;
        }
    }
    async markRead(userId, id) {
        const result = await this.notifications.update({ id, user_id: userId }, { read_at: new Date() });
        if (result.affected === 0) {
            throw new common_1.NotFoundException("Notification not found");
        }
    }
    async markAllRead(userId) {
        await this.notifications.update({ user_id: userId, read_at: (0, typeorm_2.IsNull)() }, { read_at: new Date() });
    }
    async dismiss(userId, id) {
        const result = await this.notifications.update({ id, user_id: userId }, { dismissed_at: new Date(), read_at: new Date() });
        if (result.affected === 0) {
            throw new common_1.NotFoundException("Notification not found");
        }
    }
    async getPreferences(userId) {
        return this.getOrCreatePreferences(userId);
    }
    async updatePreferences(userId, data) {
        const prefs = await this.getOrCreatePreferences(userId);
        if (data.enabled !== undefined)
            prefs.enabled = data.enabled;
        if (data.kinds)
            prefs.kinds = { ...prefs.kinds, ...data.kinds };
        return this.preferences.save(prefs);
    }
    async getOrCreatePreferences(userId) {
        let prefs = await this.preferences.findOne({ where: { user_id: userId } });
        if (!prefs) {
            prefs = this.preferences.create({
                user_id: userId,
                enabled: true,
                kinds: {
                    member: true,
                    ministry: true,
                    home_group: true,
                    system: true,
                    user: true,
                },
            });
            prefs = await this.preferences.save(prefs);
        }
        return prefs;
    }
    streamForUser(userId) {
        const state = this.acquireStream(userId);
        const heartbeat = (0, rxjs_1.interval)(30000).pipe((0, rxjs_1.map)(() => ({ type: "heartbeat" })));
        return new rxjs_1.Observable((subscriber) => {
            const sub = state.subject.subscribe((event) => {
                subscriber.next({ data: event });
            });
            const hb = heartbeat.subscribe((event) => {
                subscriber.next({ data: event });
            });
            return () => {
                sub.unsubscribe();
                hb.unsubscribe();
                this.releaseStream(userId);
            };
        });
    }
    acquireStream(userId) {
        let state = this.streams.get(userId);
        if (!state) {
            state = { subject: new rxjs_1.Subject(), refs: 0 };
            this.streams.set(userId, state);
        }
        state.refs += 1;
        return state;
    }
    releaseStream(userId) {
        const state = this.streams.get(userId);
        if (!state)
            return;
        state.refs -= 1;
        if (state.refs <= 0) {
            state.subject.complete();
            this.streams.delete(userId);
        }
    }
    pushToStream(userId, event) {
        const state = this.streams.get(userId);
        if (state) {
            state.subject.next(event);
        }
    }
};
exports.NotificationsService = NotificationsService;
exports.NotificationsService = NotificationsService = NotificationsService_1 = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(notification_entity_1.Notification)),
    __param(1, (0, typeorm_1.InjectRepository)(notification_preference_entity_1.NotificationPreference)),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        typeorm_2.Repository])
], NotificationsService);
