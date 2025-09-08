import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne } from "typeorm";
import { IsBoolean } from "class-validator";
import { Organization } from "./OrganizationModel";

@Entity()
export class Users {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ unique: true })
  email!: string;

  @Column()
  password!: string;

  @Column()
  firstName!: string;

  @Column()
  lastName!: string;

  @Column()
  role!: string; // e.g., "admin", "teacher", "student"

  @Column({ default: false })
  isEmailVerified!: boolean;

  @Column({ default: true })
  isActive!: boolean;

  @Column({ default: "en" })
  preferredLanguage!: string;

  @Column({ default: "light" })
  theme!: string;

  @Column({ default: 0 })
  totalPoints!: number;

  @Column({ default: 1 })
  level!: number;

  @Column({ default: 0 })
  streakDays!: number;

  @ManyToOne(() => Organization, org => org.users, {
    nullable: true,
    onDelete: 'CASCADE',
  })
  organization!: Organization | null;

  @Column({ default: false })
  @IsBoolean()
  disabled!: boolean;

  @Column({ default: true })
  @IsBoolean()
  firstLogin!: boolean;

  @Column({ type: 'varchar', nullable: true, length: 64 })
  resetPasswordToken?: string | null;

  @Column({ type: 'timestamp', nullable: true })
  resetPasswordExpires?: Date | null;

  @Column({ nullable: true })
  profilePicUrl?: string;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}
