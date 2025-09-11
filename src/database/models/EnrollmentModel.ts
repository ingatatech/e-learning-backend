import {
  Entity,
  PrimaryGeneratedColumn,
  ManyToOne,
  CreateDateColumn,
  UpdateDateColumn,
  Column,
} from "typeorm";
import { Users } from "./UserModel";
import { Course } from "./CourseModel";

@Entity("enrollment")
export class Enrollment {
  @PrimaryGeneratedColumn()
  id!: number;

  @ManyToOne(() => Users, (user) => user.enrollments, {
    onDelete: "CASCADE",
  })
  user!: Users;

  @ManyToOne(() => Course, (course) => course.enrollments, {
    onDelete: "CASCADE",
  })
  course!: Course;

  @Column({ default: "active" })
  status!: string; // e.g. "active", "completed", "dropped"

  @Column({ type: "float", default: 0 })
  progress!: number; // percentage

  @CreateDateColumn()
  enrolledAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}
