import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, OneToMany, CreateDateColumn, UpdateDateColumn } from "typeorm";
import { Course } from "./CourseModel";
import { Lesson } from "./LessonModel";

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

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}
