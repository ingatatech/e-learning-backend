import { Entity, PrimaryColumn, Column } from "typeorm";

@Entity()
export class SubscriptionPlan {
  @PrimaryColumn()
  id!: string; // e.g., "basic", "premium", "enterprise"

  @Column()
  name!: string;

  @Column({ type: "text" })
  description!: string;

  @Column("decimal", { precision: 10, scale: 2 })
  price!: number;

  @Column()
  currency!: string; // e.g., "usd"

  @Column()
  interval!: string; // e.g., "month", "year"

  @Column("simple-json")
  features!: string[]; // array of feature strings

  @Column({ default: false })
  popular!: boolean;
}
