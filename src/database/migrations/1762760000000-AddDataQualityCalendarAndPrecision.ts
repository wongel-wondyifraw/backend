import { MigrationInterface, QueryRunner } from "typeorm";
import {
  normalizePersonName,
  normalizeTitleInitials,
} from "../../common/utils/name-normalizer";

export class AddDataQualityCalendarAndPrecision1762760000000 implements MigrationInterface {
  name = "AddDataQualityCalendarAndPrecision1762760000000";

  private async addConstraintIfMissing(
    queryRunner: QueryRunner,
    table: string,
    constraintName: string,
    checkSql: string,
  ): Promise<void> {
    await queryRunner.query(`
      DO $$
      BEGIN
        IF NOT EXISTS (
          SELECT 1
          FROM pg_constraint
          WHERE conname = '${constraintName}'
        ) THEN
          ALTER TABLE "${table}"
          ADD CONSTRAINT "${constraintName}" CHECK (${checkSql});
        END IF;
      END
      $$;
    `);
  }

  private async normalizeTableColumn(
    queryRunner: QueryRunner,
    table: string,
    column: string,
    normalizer: (val: string) => string,
  ): Promise<void> {
    const existsRes = (await queryRunner.query(
      `SELECT to_regclass('public."${table}"') AS reg`,
    )) as { reg: string | null }[];
    if (!existsRes?.[0]?.reg) return;

    const rows = (await queryRunner.query(
      `SELECT "id", "${column}" AS val FROM "${table}" WHERE "${column}" IS NOT NULL AND TRIM("${column}") <> ''`,
    )) as { id: string; val: string }[];

    for (const row of rows) {
      const normalized = normalizer(row.val);
      if (normalized && normalized !== row.val) {
        await queryRunner.query(
          `UPDATE "${table}" SET "${column}" = $1 WHERE "id" = $2`,
          [normalized, row.id],
        );
      }
    }
  }

  public async up(queryRunner: QueryRunner): Promise<void> {
    // 1. Members precision & calendar metadata
    await queryRunner.query(`
      ALTER TABLE "members"
        ADD COLUMN IF NOT EXISTS "date_of_birth_precision" varchar(10) NOT NULL DEFAULT 'day',
        ADD COLUMN IF NOT EXISTS "date_of_birth_calendar" varchar(4) NOT NULL DEFAULT 'gc',
        ADD COLUMN IF NOT EXISTS "joined_date_precision" varchar(10) NOT NULL DEFAULT 'day',
        ADD COLUMN IF NOT EXISTS "joined_date_calendar" varchar(4) NOT NULL DEFAULT 'gc',
        ADD COLUMN IF NOT EXISTS "salvation_date_precision" varchar(10) NOT NULL DEFAULT 'day',
        ADD COLUMN IF NOT EXISTS "salvation_date_calendar" varchar(4) NOT NULL DEFAULT 'gc'
    `);
    await this.addConstraintIfMissing(
      queryRunner,
      "members",
      "CHK_members_dob_precision",
      `"date_of_birth_precision" IN ('day', 'month', 'year')`,
    );
    await this.addConstraintIfMissing(
      queryRunner,
      "members",
      "CHK_members_dob_calendar",
      `"date_of_birth_calendar" IN ('gc', 'ec')`,
    );
    await this.addConstraintIfMissing(
      queryRunner,
      "members",
      "CHK_members_joined_precision",
      `"joined_date_precision" IN ('day', 'month', 'year')`,
    );
    await this.addConstraintIfMissing(
      queryRunner,
      "members",
      "CHK_members_joined_calendar",
      `"joined_date_calendar" IN ('gc', 'ec')`,
    );
    await this.addConstraintIfMissing(
      queryRunner,
      "members",
      "CHK_members_salvation_precision",
      `"salvation_date_precision" IN ('day', 'month', 'year')`,
    );
    await this.addConstraintIfMissing(
      queryRunner,
      "members",
      "CHK_members_salvation_calendar",
      `"salvation_date_calendar" IN ('gc', 'ec')`,
    );

    // 2. Ministers precision & calendar metadata
    await queryRunner.query(`
      ALTER TABLE "ministers"
        ADD COLUMN IF NOT EXISTS "date_of_birth_precision" varchar(10) NOT NULL DEFAULT 'day',
        ADD COLUMN IF NOT EXISTS "date_of_birth_calendar" varchar(4) NOT NULL DEFAULT 'gc',
        ADD COLUMN IF NOT EXISTS "joined_date_precision" varchar(10) NOT NULL DEFAULT 'day',
        ADD COLUMN IF NOT EXISTS "joined_date_calendar" varchar(4) NOT NULL DEFAULT 'gc'
    `);
    await this.addConstraintIfMissing(
      queryRunner,
      "ministers",
      "CHK_ministers_dob_precision",
      `"date_of_birth_precision" IN ('day', 'month', 'year')`,
    );
    await this.addConstraintIfMissing(
      queryRunner,
      "ministers",
      "CHK_ministers_dob_calendar",
      `"date_of_birth_calendar" IN ('gc', 'ec')`,
    );
    await this.addConstraintIfMissing(
      queryRunner,
      "ministers",
      "CHK_ministers_joined_precision",
      `"joined_date_precision" IN ('day', 'month', 'year')`,
    );
    await this.addConstraintIfMissing(
      queryRunner,
      "ministers",
      "CHK_ministers_joined_calendar",
      `"joined_date_calendar" IN ('gc', 'ec')`,
    );

    // 3. Family children precision & calendar metadata
    await queryRunner.query(`
      ALTER TABLE "family_children"
        ADD COLUMN IF NOT EXISTS "date_of_birth_precision" varchar(10) NOT NULL DEFAULT 'day',
        ADD COLUMN IF NOT EXISTS "date_of_birth_calendar" varchar(4) NOT NULL DEFAULT 'gc'
    `);
    await this.addConstraintIfMissing(
      queryRunner,
      "family_children",
      "CHK_family_children_dob_precision",
      `"date_of_birth_precision" IN ('day', 'month', 'year')`,
    );
    await this.addConstraintIfMissing(
      queryRunner,
      "family_children",
      "CHK_family_children_dob_calendar",
      `"date_of_birth_calendar" IN ('gc', 'ec')`,
    );

    // 4. Plans & Tasks calendar tag metadata
    await queryRunner.query(`
      ALTER TABLE "plans"
        ADD COLUMN IF NOT EXISTS "plan_date_calendar" varchar(4) NOT NULL DEFAULT 'gc'
    `);
    await this.addConstraintIfMissing(
      queryRunner,
      "plans",
      "CHK_plans_plan_date_calendar",
      `"plan_date_calendar" IN ('gc', 'ec')`,
    );

    await queryRunner.query(`
      ALTER TABLE "tasks"
        ADD COLUMN IF NOT EXISTS "date_calendar" varchar(4) NOT NULL DEFAULT 'gc'
    `);
    await this.addConstraintIfMissing(
      queryRunner,
      "tasks",
      "CHK_tasks_date_calendar",
      `"date_calendar" IN ('gc', 'ec')`,
    );

    // 5. Idempotent non-destructive backfill of existing lowercase name initials
    await this.normalizeTableColumn(queryRunner, "members", "first_name", normalizePersonName);
    await this.normalizeTableColumn(queryRunner, "members", "middle_name", normalizePersonName);
    await this.normalizeTableColumn(queryRunner, "members", "last_name", normalizePersonName);
    await this.normalizeTableColumn(queryRunner, "members", "profession", normalizeTitleInitials);
    await this.normalizeTableColumn(queryRunner, "members", "employer", normalizeTitleInitials);
    await this.normalizeTableColumn(queryRunner, "members", "education_field", normalizeTitleInitials);

    await this.normalizeTableColumn(queryRunner, "ministers", "first_name", normalizePersonName);
    await this.normalizeTableColumn(queryRunner, "ministers", "middle_name", normalizePersonName);
    await this.normalizeTableColumn(queryRunner, "ministers", "last_name", normalizePersonName);
    await this.normalizeTableColumn(queryRunner, "ministers", "title", normalizeTitleInitials);

    await this.normalizeTableColumn(queryRunner, "users", "first_name", normalizePersonName);
    await this.normalizeTableColumn(queryRunner, "users", "middle_name", normalizePersonName);
    await this.normalizeTableColumn(queryRunner, "users", "last_name", normalizePersonName);
    await this.normalizeTableColumn(queryRunner, "users", "title", normalizeTitleInitials);

    await this.normalizeTableColumn(queryRunner, "families", "external_spouse_name", normalizePersonName);
    await this.normalizeTableColumn(queryRunner, "families", "external_spouse_church", normalizeTitleInitials);
    await this.normalizeTableColumn(queryRunner, "family_children", "name", normalizePersonName);

    await this.normalizeTableColumn(queryRunner, "contact_requests", "full_name", normalizePersonName);
    await this.normalizeTableColumn(queryRunner, "ministries", "name", normalizeTitleInitials);
    await this.normalizeTableColumn(queryRunner, "home_groups", "name", normalizeTitleInitials);
    await this.normalizeTableColumn(queryRunner, "bible_studies", "name", normalizeTitleInitials);
    await this.normalizeTableColumn(queryRunner, "locations", "name", normalizeTitleInitials);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "tasks" DROP CONSTRAINT IF EXISTS "CHK_tasks_date_calendar"`,
    );
    await queryRunner.query(
      `ALTER TABLE "tasks" DROP COLUMN IF EXISTS "date_calendar"`,
    );

    await queryRunner.query(
      `ALTER TABLE "plans" DROP CONSTRAINT IF EXISTS "CHK_plans_plan_date_calendar"`,
    );
    await queryRunner.query(
      `ALTER TABLE "plans" DROP COLUMN IF EXISTS "plan_date_calendar"`,
    );

    await queryRunner.query(
      `ALTER TABLE "family_children" DROP CONSTRAINT IF EXISTS "CHK_family_children_dob_calendar"`,
    );
    await queryRunner.query(
      `ALTER TABLE "family_children" DROP CONSTRAINT IF EXISTS "CHK_family_children_dob_precision"`,
    );
    await queryRunner.query(`
      ALTER TABLE "family_children"
        DROP COLUMN IF EXISTS "date_of_birth_calendar",
        DROP COLUMN IF EXISTS "date_of_birth_precision"
    `);

    await queryRunner.query(
      `ALTER TABLE "ministers" DROP CONSTRAINT IF EXISTS "CHK_ministers_joined_calendar"`,
    );
    await queryRunner.query(
      `ALTER TABLE "ministers" DROP CONSTRAINT IF EXISTS "CHK_ministers_joined_precision"`,
    );
    await queryRunner.query(
      `ALTER TABLE "ministers" DROP CONSTRAINT IF EXISTS "CHK_ministers_dob_calendar"`,
    );
    await queryRunner.query(
      `ALTER TABLE "ministers" DROP CONSTRAINT IF EXISTS "CHK_ministers_dob_precision"`,
    );
    await queryRunner.query(`
      ALTER TABLE "ministers"
        DROP COLUMN IF EXISTS "joined_date_calendar",
        DROP COLUMN IF EXISTS "joined_date_precision",
        DROP COLUMN IF EXISTS "date_of_birth_calendar",
        DROP COLUMN IF EXISTS "date_of_birth_precision"
    `);

    await queryRunner.query(
      `ALTER TABLE "members" DROP CONSTRAINT IF EXISTS "CHK_members_salvation_calendar"`,
    );
    await queryRunner.query(
      `ALTER TABLE "members" DROP CONSTRAINT IF EXISTS "CHK_members_salvation_precision"`,
    );
    await queryRunner.query(
      `ALTER TABLE "members" DROP CONSTRAINT IF EXISTS "CHK_members_joined_calendar"`,
    );
    await queryRunner.query(
      `ALTER TABLE "members" DROP CONSTRAINT IF EXISTS "CHK_members_joined_precision"`,
    );
    await queryRunner.query(
      `ALTER TABLE "members" DROP CONSTRAINT IF EXISTS "CHK_members_dob_calendar"`,
    );
    await queryRunner.query(
      `ALTER TABLE "members" DROP CONSTRAINT IF EXISTS "CHK_members_dob_precision"`,
    );
    await queryRunner.query(`
      ALTER TABLE "members"
        DROP COLUMN IF EXISTS "salvation_date_calendar",
        DROP COLUMN IF EXISTS "salvation_date_precision",
        DROP COLUMN IF EXISTS "joined_date_calendar",
        DROP COLUMN IF EXISTS "joined_date_precision",
        DROP COLUMN IF EXISTS "date_of_birth_calendar",
        DROP COLUMN IF EXISTS "date_of_birth_precision"
    `);
  }
}

