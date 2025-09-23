import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, CreateDateColumn } from "typeorm"
import { Users } from "./UserModel"
import { Assessment } from "./AssessmentModel"
import { AssessmentQuestion } from "./AssessmentQuestionModel"

@Entity()
export class Answer {
  @PrimaryGeneratedColumn("uuid")
  id!: string

  @ManyToOne(() => Users)
  user!: Users

  @ManyToOne(() => Assessment)
  assessment!: Assessment

  @ManyToOne(() => AssessmentQuestion)
  question!: AssessmentQuestion

  @Column("simple-json")
  answer!: string | string[] // store single answer or array for checkboxes

  @Column({ type: "boolean", default: false })
  isCorrect!: boolean

  @Column({ type: "int", nullable: true })
  pointsEarned!: number

  @CreateDateColumn()
  createdAt!: Date
}
