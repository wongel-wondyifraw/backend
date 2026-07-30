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
var NotificationDomainListener_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.NotificationDomainListener = void 0;
const common_1 = require("@nestjs/common");
const event_emitter_1 = require("@nestjs/event-emitter");
const notification_events_1 = require("./notification-events");
const notification_audience_service_1 = require("./notification-audience.service");
const notifications_service_1 = require("./notifications.service");
const notification_entity_1 = require("./entities/notification.entity");
let NotificationDomainListener = NotificationDomainListener_1 = class NotificationDomainListener {
    constructor(audience, notifications) {
        this.audience = audience;
        this.notifications = notifications;
        this.logger = new common_1.Logger(NotificationDomainListener_1.name);
    }
    async handle(event) {
        const users = await this.audience.resolveRecipients({
            targetRoles: event.targetRoles,
            includeAdmins: event.includeAdmins,
            excludeUserId: event.actorUserId,
        });
        const kindMap = {
            member: notification_entity_1.NotificationKind.MEMBER,
            ministry: notification_entity_1.NotificationKind.MINISTRY,
            home_group: notification_entity_1.NotificationKind.HOME_GROUP,
            system: notification_entity_1.NotificationKind.SYSTEM,
            user: notification_entity_1.NotificationKind.USER,
        };
        const severityMap = {
            info: notification_entity_1.NotificationSeverity.INFO,
            success: notification_entity_1.NotificationSeverity.SUCCESS,
            warning: notification_entity_1.NotificationSeverity.WARNING,
            danger: notification_entity_1.NotificationSeverity.DANGER,
        };
        await Promise.all(users.map(async (user) => {
            var _a, _b, _c;
            try {
                await this.notifications.create({
                    userId: user.id,
                    kind: (_a = kindMap[event.kind]) !== null && _a !== void 0 ? _a : notification_entity_1.NotificationKind.SYSTEM,
                    severity: (_b = severityMap[event.severity]) !== null && _b !== void 0 ? _b : notification_entity_1.NotificationSeverity.INFO,
                    title: event.title,
                    message: event.message,
                    href: event.href,
                    payload: {
                        ...((_c = event.payload) !== null && _c !== void 0 ? _c : {}),
                        eventName: event.eventName,
                    },
                    dedupeKey: event.dedupeKey
                        ? `${event.dedupeKey}:user:${user.id}`
                        : undefined,
                });
            }
            catch (err) {
                this.logger.warn(`Could not create notification for user=${user.id}: ${String(err)}`);
            }
        }));
    }
};
exports.NotificationDomainListener = NotificationDomainListener;
__decorate([
    (0, event_emitter_1.OnEvent)(notification_events_1.NOTIFICATION_EVENT, { async: true }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], NotificationDomainListener.prototype, "handle", null);
exports.NotificationDomainListener = NotificationDomainListener = NotificationDomainListener_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [notification_audience_service_1.NotificationAudienceService,
        notifications_service_1.NotificationsService])
], NotificationDomainListener);
