import {
  Body,
  Controller,
  Get,
  MessageEvent,
  Param,
  ParseUUIDPipe,
  Patch,
  Req,
  Sse,
} from "@nestjs/common";
import { Observable } from "rxjs";
import { NotificationsService } from "./notifications.service";
import { RequiresPermissions } from "../../common/decorators/permissions.decorator";
import { User } from "../users/entities/user.entity";

@Controller("notifications")
export class NotificationsController {
  constructor(private readonly notificationsService: NotificationsService) {}

  @Get()
  @RequiresPermissions("notifications.read")
  list(@Req() req: { user: User }) {
    return this.notificationsService.listForUser(req.user.id);
  }

  @Get("preferences")
  @RequiresPermissions("notifications.update")
  getPreferences(@Req() req: { user: User }) {
    return this.notificationsService.getPreferences(req.user.id);
  }

  @Patch("preferences")
  @RequiresPermissions("notifications.update")
  updatePreferences(
    @Req() req: { user: User },
    @Body() body: { enabled?: boolean; kinds?: Record<string, boolean> },
  ) {
    return this.notificationsService.updatePreferences(req.user.id, body);
  }

  @Patch("read-all")
  @RequiresPermissions("notifications.read")
  markAllRead(@Req() req: { user: User }) {
    return this.notificationsService.markAllRead(req.user.id);
  }

  @Patch(":id/read")
  @RequiresPermissions("notifications.read")
  markRead(@Req() req: { user: User }, @Param("id", ParseUUIDPipe) id: string) {
    return this.notificationsService.markRead(req.user.id, id);
  }

  @Patch(":id/dismiss")
  @RequiresPermissions("notifications.read")
  dismiss(@Req() req: { user: User }, @Param("id", ParseUUIDPipe) id: string) {
    return this.notificationsService.dismiss(req.user.id, id);
  }

  @Sse("stream")
  @RequiresPermissions("notifications.read")
  stream(@Req() req: { user: User }): Observable<MessageEvent> {
    return this.notificationsService.streamForUser(req.user.id);
  }
}
