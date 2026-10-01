export const NOTIFICATION_EVENT = "notification.domain";

export type NotificationDomainKind =
  "member" | "ministry" | "home_group" | "system" | "user";

export interface NotificationDomainEvent {
  eventName: string;
  kind: NotificationDomainKind;
  severity: "info" | "success" | "warning" | "danger";
  title: string;
  message: string;
  href?: string;
  payload?: Record<string, unknown>;
  dedupeKey?: string;
  targetRoles?: string[];
  includeAdmins?: boolean;
  actorUserId?: string;
}
