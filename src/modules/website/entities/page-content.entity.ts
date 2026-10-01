import {
  Entity,
  Column,
  PrimaryColumn,
  CreateDateColumn,
  UpdateDateColumn,
} from "typeorm";

@Entity("page_contents")
export class PageContent {
  @PrimaryColumn("varchar")
  page_slug: string; // e.g., 'about_us', 'contact_us', 'vision'

  @Column({ type: "jsonb" })
  content: Record<string, unknown> | string; // structured content blocks or plain text

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;
}
