import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, OneToMany, CreateDateColumn, UpdateDateColumn, OneToOne } from "typeorm";
import { Course } from "./CourseModel";
import { Lesson } from "./LessonModel";
import { Assessment } from "./AssessmentModel";
import { ModuleFinal } from "./ModuleFinal";

@Entity()
export class Module {
  @PrimaryGeneratedColumn()
  id!: string;

  @Column()
  title!: string;

  @Column("text")
  description!: string;

  @Column("int")
  order!: number;

  @ManyToOne(() => Course, (course) => course.modules, { onDelete: "CASCADE" })
  course!: Course;

  @OneToMany(() => Lesson, (lesson) => lesson.module)
  lessons!: Lesson[];

  @OneToOne(() => ModuleFinal, (final) => final.module)
  final!: ModuleFinal;


  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}
