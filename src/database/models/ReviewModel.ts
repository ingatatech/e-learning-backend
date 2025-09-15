import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, CreateDateColumn } from "typeorm"
import { Users } from "./UserModel"
import { Course } from "./CourseModel"

@Entity()
export class Review {
  @PrimaryGeneratedColumn()
  id!: string

  @Column("int")
  rating!: number

  @Column("text")
  comment!: string

  @ManyToOne(() => Users, (user) => user.reviews, { onDelete: "CASCADE" })
  user!: Users

  @ManyToOne(() => Course, (course) => course.reviews, { onDelete: "CASCADE" })
  course!: Course

  @CreateDateColumn()
  createdAt!: Date
}
