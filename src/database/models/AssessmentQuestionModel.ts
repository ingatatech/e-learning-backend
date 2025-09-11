import { Entity, PrimaryGeneratedColumn, Column, ManyToOne } from "typeorm";
import { Assessment } from "./AssessmentModel";

export enum QuestionType {
  MULTIPLE_CHOICE = "multiple_choice",
  TRUE_FALSE = "true_false",
  SHORT_ANSWER = "short_answer",
  ESSAY = "essay",
}

@Entity()
export class AssessmentQuestion {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @Column("text")
  question!: string;

  @Column({ type: "enum", enum: QuestionType })
  type!: QuestionType;

  @Column("simple-array", { nullable: true })
  options!: string[];

  @Column("text")
  correctAnswer!: string; // can be JSON/stringified for multiple answers

  @Column("int")
  points!: number;

  @ManyToOne(() => Assessment, (assessment) => assessment.questions, { onDelete: "CASCADE" })
  assessment!: Assessment;
}
