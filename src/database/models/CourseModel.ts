import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, OneToMany, CreateDateColumn, UpdateDateColumn } from "typeorm";
import { Users } from "./UserModel";
import { Organization } from "./OrganizationModel";
import { Module } from "./ModuleModel";
import { Enrollment } from "./EnrollmentModel";

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

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}
