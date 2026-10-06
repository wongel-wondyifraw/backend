import { randomUUID } from "crypto";
import { BeforeInsert, PrimaryColumn } from "typeorm";

/**
 * UUID primary key generated in Node. Avoids Postgres
 * uuid_generate_v4() / extensions (required on restricted hosts like cPanel).
 */
export abstract class UuidPrimary {
  @PrimaryColumn("uuid")
  id: string = randomUUID();

  @BeforeInsert()
  ensureId(): void {
    if (!this.id) {
      this.id = randomUUID();
    }
  }
}
