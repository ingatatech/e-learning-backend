import { Entity, PrimaryGeneratedColumn, Column } from "typeorm";

@Entity()
export class Leaderboard {
  @PrimaryGeneratedColumn()
  id!: number; // or string if you want to keep IDs like in your mock

  @Column()
  firstName!: string;

  @Column()
  lastName!: string;

  @Column()
  avatar!: string; // URL to avatar image

  @Column({ default: 0 })
  totalPoints!: number;

  @Column({ default: 1 })
  level!: number;

  @Column({ default: 0 })
  rank!: number;
}
