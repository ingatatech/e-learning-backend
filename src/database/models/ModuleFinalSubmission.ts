import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, OneToMany, CreateDateColumn, UpdateDateColumn } from "typeorm";
import { ModuleFinal } from "./ModuleFinal";


@Entity()
export class ModuleFinalSubmission {
  @PrimaryGeneratedColumn()
  id!: number;

  @ManyToOne(() => ModuleFinal, { onDelete: "CASCADE" })
  finalAssessment!: ModuleFinal;

  @Column("int")
  userId!: number;

  @Column({ type: "text", nullable: true })
  fileUrl?: string;

  @Column({ type: "text", nullable: true })
  answers?: string; // JSON string for quiz answers if needed

  @Column({ type: "enum", enum: ["pending", "passed", "failed"], default: "pending" })
  status!: "pending" | "passed" | "failed";

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}
