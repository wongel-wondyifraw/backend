import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { Notification } from "./entities/notification.entity";
import { NotificationPreference } from "./entities/notification-preference.entity";
import { NotificationsService } from "./notifications.service";
import { NotificationsController } from "./notifications.controller";
import { NotificationDomainListener } from "./notification-domain.listener";
import { NotificationAudienceService } from "./notification-audience.service";
import { User } from "../users/entities/user.entity";

@Module({
  imports: [
    TypeOrmModule.forFeature([Notification, NotificationPreference, User]),
  ],
  controllers: [NotificationsController],
  providers: [
    NotificationsService,
    NotificationDomainListener,
    NotificationAudienceService,
  ],
  exports: [NotificationsService],
})
export class NotificationsModule {}
