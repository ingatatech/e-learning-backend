import { Entity, PrimaryColumn, Column, CreateDateColumn } from "typeorm";

@Entity()
export class Payment {
  @PrimaryColumn()
  id!: string; // e.g., "pay_abc123"

  @Column()
  paymentIntentId!: string;

  @Column()
  courseId!: string;

  @Column()
  userId!: string;

  @Column("decimal", { precision: 10, scale: 2 })
  amount!: number;

  @Column()
  currency!: string; // e.g., "usd"

  @Column()
  status!: string; // e.g., "succeeded", "pending"

  @Column()
  method!: string; // e.g., "card", "paypal"

  @CreateDateColumn()
  createdAt!: Date;
}
