import { MigrationInterface, QueryRunner } from "typeorm";

/**
 * Hardening indexes + partial unique member email.
 * Fails if duplicate non-null emails exist — clean them before running.
 */
export class AddHardeningIndexes1735689600000 implements MigrationInterface {
  name = "AddHardeningIndexes1735689600000";

  public async up(queryRunner: QueryRunner): Promise<void> {
    const dupes = await queryRunner.query(`
      SELECT LOWER(email) AS email, COUNT(*) AS cnt
      FROM members
      WHERE email IS NOT NULL AND TRIM(email) <> ''
      GROUP BY LOWER(email)
      HAVING COUNT(*) > 1
    `);
    if (Array.isArray(dupes) && dupes.length > 0) {
      const sample = dupes
        .slice(0, 5)
        .map((d: { email: string; cnt: string }) => `${d.email} (${d.cnt})`)
        .join(", ");
      throw new Error(
        `Cannot create unique member email index: duplicate emails found: ${sample}. Resolve duplicates then re-run migrations.`,
      );
    }

    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "IDX_members_status_created_at"
      ON "members" ("status", "created_at")
    `);
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "IDX_members_joined_date"
      ON "members" ("joined_date")
    `);
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "IDX_members_email"
      ON "members" ("email")
    `);
    await queryRunner.query(`
      CREATE UNIQUE INDEX IF NOT EXISTS "UQ_members_email_lower_not_null"
      ON "members" (LOWER(email))
      WHERE email IS NOT NULL AND TRIM(email) <> ''
    `);
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "IDX_ministries_leader_id"
      ON "ministries" ("leader_id")
    `);
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "IDX_home_groups_leader_id"
      ON "home_groups" ("leader_id")
    `);
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "IDX_bible_studies_leader_id"
      ON "bible_studies" ("leader_id")
    `);
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "IDX_families_husband_id"
      ON "families" ("husband_id")
    `);
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "IDX_families_wife_id"
      ON "families" ("wife_id")
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `DROP INDEX IF EXISTS "UQ_members_email_lower_not_null"`,
    );
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_members_email"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_members_joined_date"`);
    await queryRunner.query(
      `DROP INDEX IF EXISTS "IDX_members_status_created_at"`,
    );
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_ministries_leader_id"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_home_groups_leader_id"`);
    await queryRunner.query(
      `DROP INDEX IF EXISTS "IDX_bible_studies_leader_id"`,
    );
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_families_husband_id"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_families_wife_id"`);
  }
}
