import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, OneToMany, CreateDateColumn, UpdateDateColumn } from "typeorm";
import { Users } from "./UserModel";
import { Organization } from "./OrganizationModel";
import { Module } from "./ModuleModel";
import { Enrollment } from "./EnrollmentModel";
import { Category } from "./CategoryModel";
import { Review } from "./ReviewModel";

export enum CourseLevel {
  BEGINNER = "beginner",
  INTERMEDIATE = "intermediate",
  ADVANCED = "advanced",
}

@Entity()
export class Course {
  @PrimaryGeneratedColumn()
  id!: string;

  @Column()
  title!: string;

  @Column("text")
  description!: string;

  @Column({ nullable: true })
  thumbnail!: string;

  @Column({ type: "enum", enum: CourseLevel })
  level!: CourseLevel;

  @Column("decimal", { precision: 10, scale: 2, default: 0 })
  price!: number;

  @Column({ default: false })
  isPublished!: boolean;

  @Column("int", { default: 0 })
  duration!: number; // in hours

  @ManyToOne(() => Category, (category) => category.courses, { onDelete: "SET NULL" })
  category!: Category;

  @Column("int", { default: 0 })
  enrollmentCount!: number;

  @Column("float", { default: 0 })
  rating!: number;

  @Column("simple-array", { nullable: true })
  tags!: string[];

  @ManyToOne(() => Users, (user) => user.courses, { onDelete: "SET NULL" })
  instructor!: Users;

  @ManyToOne(() => Organization, (org) => org.courses, { nullable: true, onDelete: "SET NULL" })
  organization!: Organization | null;

  @OneToMany(() => Module, (module) => module.course, { onDelete: "CASCADE" })
  modules!: Module[];

  @OneToMany(() => Enrollment, (enrollment) => enrollment.course)
  enrollments!: Enrollment[];

  @Column("int", { default: 0 })
  lessonsCount!: number

  @Column("int", { default: 0 })
  projectsCount!: number

  @Column("int", { default: 0 })
  exercisesCount!: number

  @Column({ default: false })
  certificateIncluded!: boolean

  @Column({ default: "English" })
  language!: string

  @Column("text", { nullable: true })
  about!: string // long description

  @Column("simple-array", { nullable: true })
  whatYouWillLearn!: string[] // list of bullet points

  @Column("simple-array", { nullable: true })
  requirements!: string[] // list of requirements

  @OneToMany(() => Review, (review) => review.course, { cascade: true, nullable: true })
  reviews!: Review[]

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}
