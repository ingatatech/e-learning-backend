import { Module } from "./ModuleModel";
import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, OneToMany, CreateDateColumn, UpdateDateColumn, JoinColumn, OneToOne } from "typeorm";
import { Assessment } from "./AssessmentModel";

@Entity()
export class ModuleFinal {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column()
  title!: string;

  @OneToOne(() => Module, (module) => module.finalAssessment, { onDelete: "CASCADE" })
  @JoinColumn()
  module!: Module;

  @Column({
    type: "enum",
    enum: ["assessment", "project"],
  })
  type!: "assessment" | "project";

  // Only used if type = assessment
  @ManyToOne(() => Assessment, { nullable: true, onDelete: "CASCADE" })
  assessment?: Assessment;

  // Only used if type = project
  @Column({ type: "text", nullable: true })
  instructions?: string;

  @Column("int")
  passingScore!: number;

  @Column("int", { nullable: true })
  timeLimit!: number | null;

  @Column({ default: false })
  fileRequired!: boolean;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}
