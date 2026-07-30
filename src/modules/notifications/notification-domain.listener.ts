import { Injectable, Logger } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import {
  NotificationDomainEvent,
  NOTIFICATION_EVENT,
} from './notification-events';
import { NotificationAudienceService } from './notification-audience.service';
import { NotificationsService } from './notifications.service';
import { NotificationKind, NotificationSeverity } from './entities/notification.entity';

@Injectable()
export class NotificationDomainListener {
  private readonly logger = new Logger(NotificationDomainListener.name);

  constructor(
    private readonly audience: NotificationAudienceService,
    private readonly notifications: NotificationsService,
  ) {}

  @OnEvent(NOTIFICATION_EVENT, { async: true })
  async handle(event: NotificationDomainEvent): Promise<void> {
    const users = await this.audience.resolveRecipients({
      targetRoles: event.targetRoles,
      includeAdmins: event.includeAdmins,
      excludeUserId: event.actorUserId,
    });

    const kindMap: Record<string, NotificationKind> = {
      member: NotificationKind.MEMBER,
      ministry: NotificationKind.MINISTRY,
      home_group: NotificationKind.HOME_GROUP,
      system: NotificationKind.SYSTEM,
      user: NotificationKind.USER,
    };

    const severityMap: Record<string, NotificationSeverity> = {
      info: NotificationSeverity.INFO,
      success: NotificationSeverity.SUCCESS,
      warning: NotificationSeverity.WARNING,
      danger: NotificationSeverity.DANGER,
    };

    await Promise.all(
      users.map(async (user) => {
        try {
          await this.notifications.create({
            userId: user.id,
            kind: kindMap[event.kind] ?? NotificationKind.SYSTEM,
            severity: severityMap[event.severity] ?? NotificationSeverity.INFO,
            title: event.title,
            message: event.message,
            href: event.href,
            payload: {
              ...(event.payload ?? {}),
              eventName: event.eventName,
            },
            dedupeKey: event.dedupeKey
              ? `${event.dedupeKey}:user:${user.id}`
              : undefined,
          });
        } catch (err) {
          this.logger.warn(
            `Could not create notification for user=${user.id}: ${String(err)}`,
          );
        }
      }),
    );
  }
}
