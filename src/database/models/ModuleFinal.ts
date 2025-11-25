import { Module } from "./ModuleModel";
import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, OneToMany, CreateDateColumn, UpdateDateColumn, JoinColumn, OneToOne } from "typeorm";
import { Assessment } from "./AssessmentModel";

@Entity()
export class ModuleFinal {
  @PrimaryGeneratedColumn()
  id!: number;

  @OneToOne(() => Module, (module) => module.final, { onDelete: "CASCADE" })
    @JoinColumn()
    module!: Module;


  @Column({
    type: "enum",
    enum: ["assessment", "project"],
  })
  type!: "assessment" | "project";

  // Only used if type = assessment
  @ManyToOne(() => Assessment, { nullable: true })
  assessment?: Assessment;

  // Only used if type = project
  @Column({ type: "text", nullable: true })
  instructions?: string;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}
