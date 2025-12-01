import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, OneToMany, CreateDateColumn, UpdateDateColumn } from "typeorm";
import { Lesson } from "./LessonModel";
import { Course } from "./CourseModel";
import { AssessmentQuestion } from "./AssessmentQuestionModel";
import { Module } from "./ModuleModel";

export enum AssessmentType {
  QUIZ = "quiz",
  ASSIGNMENT = "assignment",
  PROJECT = "project",
  ASSESSMENT = "assessment",
}

@Entity()
export class Assessment {
  @PrimaryGeneratedColumn()
  id!: string;

  @Column()
  title!: string;

  @Column("text")
  description!: string;

  @Column({ type: "enum", enum: AssessmentType })
  type!: AssessmentType;

  @Column("int")
  passingScore!: number;

  @Column("int", { nullable: true })
  timeLimit!: number | null;

  @ManyToOne(() => Lesson, (lesson) => lesson.assessments, { nullable: true, onDelete: "CASCADE" })
  lesson!: Lesson | null;

  @ManyToOne(() => Course, (course) => course.modules, { nullable: true, onDelete: "CASCADE" })
  course!: Course | null;

  @ManyToOne(() => Module, (module) => module.assessments, { nullable: true, onDelete: "CASCADE" })
  module!: Module | null;

  @OneToMany(() => AssessmentQuestion, (question) => question.assessment, { cascade: true })
  questions!: AssessmentQuestion[];

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}
