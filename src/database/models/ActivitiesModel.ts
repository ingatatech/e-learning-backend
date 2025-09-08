import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, CreateDateColumn } from "typeorm";
import { Users } from "./UserModel";

@Entity()
export class ActivityLog {
  @PrimaryGeneratedColumn()
  id!: number;

  @ManyToOne(() => Users, { nullable: true, onDelete: "SET NULL" })
  user!: Users | null; // Null if system-triggered

  @Column()
  action!: string; // e.g. "Created Organization", "Deleted File"

  @Column({ nullable: true })
  targetId!: string; // ID of affected resource (file ID, folder ID, etc.)

  @Column({ nullable: true })
  targetType!: string; // e.g. "File", "Users"

  @Column({ type: "text", nullable: true })
  details!: string; // Optional message or metadata (e.g. JSON.stringify())

  @CreateDateColumn()
  createdAt!: Date;
}
