import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, CreateDateColumn } from "typeorm";
import { Users } from "./UserModel";

@Entity()
export class UserAction {
  @PrimaryGeneratedColumn()
  id!: number;

  @ManyToOne(() => Users)
  user!: Users;

  @Column()
  action!: string; // lesson_completed, quiz_passed, etc.

  @Column({ default: 1 })
  multiplier!: number;

  @Column()
  pointsEarned!: number;

  @CreateDateColumn()
  createdAt!: Date;
}
