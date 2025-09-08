import { Entity, PrimaryColumn, Column } from "typeorm";

interface BadgeCriteria {
  type: string; // e.g., "courses", "streak", "points", etc.
  threshold: number;
  timeframe?: string; // optional
}

@Entity()
export class Badge {
  @PrimaryColumn()
  id!: string; // e.g., "first-course"

  @Column()
  name!: string;

  @Column({ type: "text" })
  description!: string;

  @Column()
  icon!: string; // e.g., "graduation-cap"

  @Column()
  rarity!: string; // e.g., "common", "rare"

  @Column("simple-json")
  criteria!: BadgeCriteria;
}
