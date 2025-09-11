import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, OneToMany, CreateDateColumn, UpdateDateColumn } from "typeorm";
import { Module } from "./ModuleModel";
import { Assessment } from "./AssessmentModel";

@Entity()
export class Lesson {
  @PrimaryGeneratedColumn()
  id!: string;

  @Column()
  title!: string;

  @Column("text")
  content!: string;

  @Column({ nullable: true })
  videoUrl!: string;

  @Column("int")
  duration!: number;

  @Column("int")
  order!: number;

  @ManyToOne(() => Module, (module) => module.lessons, { onDelete: "CASCADE" })
  module!: Module;

  @OneToMany(() => Assessment, (assessment) => assessment.lesson)
  assessments!: Assessment[];

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}
