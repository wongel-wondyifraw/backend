import { Injectable, Logger, OnModuleInit } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { UsersService } from "../modules/users/users.service";

@Injectable()
export class AdminSeedService implements OnModuleInit {
  private readonly logger = new Logger(AdminSeedService.name);

  constructor(
    private readonly config: ConfigService,
    private readonly usersService: UsersService,
  ) {}

  async onModuleInit() {
    const email = this.config.get<string>("ADMIN_EMAIL")?.trim().toLowerCase();
    const password = this.config.get<string>("ADMIN_PASSWORD");

    if (!email || !password) {
      this.logger.debug(
        "Admin seed skipped: ADMIN_EMAIL or ADMIN_PASSWORD not set",
      );
      return;
    }

    const existing = await this.usersService.findOneByEmail(email);

    if (existing) {
      await this.usersService.setPasswordFromPlain(existing.id, password);
      this.logger.log(`Admin password synced from env: ${email}`);
      return;
    }

    await this.usersService.create({
      first_name: this.config.get<string>("ADMIN_FIRST_NAME", "System"),
      middle_name: this.config.get<string>("ADMIN_MIDDLE_NAME", ""),
      last_name: this.config.get<string>("ADMIN_LAST_NAME", "Admin"),
      email,
      password,
      role: "admin",
      is_active: true,
    });

    this.logger.log(`Admin user seeded: ${email}`);
  }
}
