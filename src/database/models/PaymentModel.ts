import { Entity, PrimaryColumn, Column, CreateDateColumn, UpdateDateColumn, PrimaryGeneratedColumn } from "typeorm";

@Entity()
export class Payment {
  @PrimaryGeneratedColumn()
  id!: string; // e.g., "pay_abc123"

  @Column({ unique: true })
  paymentIntentId!: string;

  @Column()
  courseId!: string;

  @Column()
  userId!: string;

  @Column("decimal", { precision: 10, scale: 2 })
  amount!: number;

  @Column({ default: "rwf" })
  currency!: string;

  @Column({ default: "pending" })
  status!: string;

  @Column()
  method!: string; // e.g., "card", "paypal"

  @Column("json", { nullable: true })
  metadata?: Record<string, any>; // optional extra info

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}
