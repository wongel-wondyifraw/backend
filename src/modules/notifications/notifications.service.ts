import {
  Injectable,
  Logger,
  MessageEvent,
  NotFoundException,
} from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Subject, Observable, interval, map } from "rxjs";
import { IsNull, Repository } from "typeorm";
import {
  Notification,
  NotificationKind,
  NotificationSeverity,
} from "./entities/notification.entity";
import { NotificationPreference } from "./entities/notification-preference.entity";

export interface CreateNotificationInput {
  userId: string;
  kind: NotificationKind;
  severity: NotificationSeverity;
  title: string;
  message: string;
  href?: string;
  payload?: Record<string, unknown>;
  dedupeKey?: string;
}

type NotificationStreamEvent = Record<string, unknown> | { type: "heartbeat" };

interface UserStreamState {
  subject: Subject<NotificationStreamEvent>;
  refs: number;
}

@Injectable()
export class NotificationsService {
  private readonly logger = new Logger(NotificationsService.name);
  private readonly streams = new Map<string, UserStreamState>();

  constructor(
    @InjectRepository(Notification)
    private readonly notifications: Repository<Notification>,
    @InjectRepository(NotificationPreference)
    private readonly preferences: Repository<NotificationPreference>,
  ) {}

  async listForUser(userId: string, limit = 20) {
    const items = await this.notifications.find({
      where: { user_id: userId, dismissed_at: IsNull() },
      order: { created_at: "DESC" },
      take: limit,
    });
    const unreadCount = await this.notifications.count({
      where: { user_id: userId, read_at: IsNull(), dismissed_at: IsNull() },
    });
    return { items, unreadCount };
  }

  async create(input: CreateNotificationInput): Promise<Notification | null> {
    const prefs = await this.getOrCreatePreferences(input.userId);
    if (!prefs.enabled) return null;
    if (prefs.kinds[input.kind] === false) return null;

    if (input.dedupeKey) {
      const existing = await this.notifications.findOne({
        where: { user_id: input.userId, dedupe_key: input.dedupeKey },
      });
      if (existing) return existing;
    }

    const row = this.notifications.create({
      user_id: input.userId,
      kind: input.kind,
      severity: input.severity,
      title: input.title,
      message: input.message,
      href: input.href ?? null,
      payload: input.payload ?? null,
      dedupe_key: input.dedupeKey ?? null,
    });

    try {
      const saved = await this.notifications.save(row);
      this.pushToStream(input.userId, {
        type: "notification",
        notification: saved,
      });
      return saved;
    } catch (err) {
      if (
        input.dedupeKey &&
        err instanceof Error &&
        err.message.includes("duplicate")
      ) {
        return null;
      }
      throw err;
    }
  }

  async markRead(userId: string, id: string): Promise<void> {
    const result = await this.notifications.update(
      { id, user_id: userId },
      { read_at: new Date() },
    );
    if (result.affected === 0) {
      throw new NotFoundException("Notification not found");
    }
  }

  async markAllRead(userId: string): Promise<void> {
    await this.notifications.update(
      { user_id: userId, read_at: IsNull() },
      { read_at: new Date() },
    );
  }

  async dismiss(userId: string, id: string): Promise<void> {
    const result = await this.notifications.update(
      { id, user_id: userId },
      { dismissed_at: new Date(), read_at: new Date() },
    );
    if (result.affected === 0) {
      throw new NotFoundException("Notification not found");
    }
  }

  async getPreferences(userId: string) {
    return this.getOrCreatePreferences(userId);
  }

  async updatePreferences(
    userId: string,
    data: { enabled?: boolean; kinds?: Record<string, boolean> },
  ) {
    const prefs = await this.getOrCreatePreferences(userId);
    if (data.enabled !== undefined) prefs.enabled = data.enabled;
    if (data.kinds) prefs.kinds = { ...prefs.kinds, ...data.kinds };
    return this.preferences.save(prefs);
  }

  private async getOrCreatePreferences(
    userId: string,
  ): Promise<NotificationPreference> {
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

  streamForUser(userId: string): Observable<MessageEvent> {
    const state = this.acquireStream(userId);
    const heartbeat = interval(30000).pipe(
      map((): { type: "heartbeat" } => ({ type: "heartbeat" })),
    );

    return new Observable<MessageEvent>((subscriber) => {
      const sub = state.subject.subscribe((event: NotificationStreamEvent) => {
        subscriber.next({ data: event });
      });
      const hb = heartbeat.subscribe((event: { type: "heartbeat" }) => {
        subscriber.next({ data: event });
      });

      return () => {
        sub.unsubscribe();
        hb.unsubscribe();
        this.releaseStream(userId);
      };
    });
  }

  private acquireStream(userId: string): UserStreamState {
    let state = this.streams.get(userId);
    if (!state) {
      state = { subject: new Subject<NotificationStreamEvent>(), refs: 0 };
      this.streams.set(userId, state);
    }
    state.refs += 1;
    return state;
  }

  private releaseStream(userId: string): void {
    const state = this.streams.get(userId);
    if (!state) return;
    state.refs -= 1;
    if (state.refs <= 0) {
      state.subject.complete();
      this.streams.delete(userId);
    }
  }

  private pushToStream(userId: string, event: Record<string, unknown>): void {
    const state = this.streams.get(userId);
    if (state) {
      state.subject.next(event);
    }
  }
}
