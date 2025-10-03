import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
  UpdateDateColumn,
} from "typeorm"
import { Users } from "./UserModel"
import { Course } from "./CourseModel"
import { Lesson } from "./LessonModel"
import { Assessment } from "./AssessmentModel"

@Entity()
export class Progress {
  @PrimaryGeneratedColumn()
  id!: number

  @ManyToOne(() => Users, (user) => user.progress, { onDelete: "CASCADE" })
  @JoinColumn({ name: "userId" })
  user!: Users

  @Column()
  userId!: number

  @ManyToOne(() => Course, (course) => course.progress, { onDelete: "CASCADE" })
  @JoinColumn({ name: "courseId" })
  course!: Course

  @Column()
  courseId!: number

  @ManyToOne(() => Lesson, { nullable: true, onDelete: "CASCADE" })
  @JoinColumn({ name: "lessonId" })
  lesson?: Lesson

  @Column({ nullable: true })
  lessonId?: number

  @ManyToOne(() => Assessment, { nullable: true, onDelete: "CASCADE" })
  @JoinColumn({ name: "assessmentId" })
  assessment?: Assessment

  @Column({ nullable: true })
  assessmentId?: number

  @Column({ default: false })
  isCompleted!: boolean

  @Column({ type: "text", nullable: true })
  status?: string | null;

  @Column({ type: "float", nullable: true })
  score?: number

  @CreateDateColumn()
  completedAt!: Date

  @UpdateDateColumn()
  lastAccessedAt!: Date
}
