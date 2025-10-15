import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, OneToMany } from "typeorm";
import { IsBoolean } from "class-validator";
import { Organization } from "./OrganizationModel";
import { Notification } from "./NotificationsModel";
import { Course } from "./CourseModel";
import { Enrollment } from "./EnrollmentModel";
import { Review } from "./ReviewModel";
import { Progress } from "./ProgressModel";
import { Document } from "./DocumentModel";
import { Certificate } from "./CertificateModel";

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

  @Column({ type: 'timestamptz', nullable: true })
  resetPasswordExpires?: Date | null;

  @Column({ nullable: true })
  profilePicUrl?: string;

  @OneToMany(() => Notification, notification => notification.user, { cascade: true })
  notifications!: Notification[];

  @OneToMany(() => Course, (course) => course.instructor)
  courses!: Course[];

  @OneToMany(() => Enrollment, (enrollment) => enrollment.user, { cascade: true })
  enrollments!: Enrollment[];

  @OneToMany(() => Certificate, (certificate) => certificate.user)
  certificates!: Certificate[]

  @Column("simple-json", { nullable: true })
  notificationSettings?: Record<string, any>;

  @OneToMany(() => Review, (review) => review.user)
  reviews!: Review[]

  @OneToMany(() => Progress, (progress) => progress.user)
  progress!: Progress[]

  @OneToMany(() => Document, (document) => document.instructor, { cascade: true })
  documents!: Document[];

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}
