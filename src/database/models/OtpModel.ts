import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, Index } from "typeorm";

@Entity()
export class Otp {
  @PrimaryGeneratedColumn()
  id!: string;

  @Index()
  @Column()
  userId!: number;

  @Column()
  otpCode!: string;

  @Column()
  expiresAt!: Date;

  @Column({ default: false })
  used!: boolean; 

  @CreateDateColumn()
  createdAt!: Date;
}
