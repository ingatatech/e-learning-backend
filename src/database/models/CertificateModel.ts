import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, CreateDateColumn } from "typeorm";
import { Users } from "./UserModel";
import { Course } from "./CourseModel";

@Entity()
export class Certificate {
  @PrimaryGeneratedColumn()
  id!: number;

  @ManyToOne(() => Users, (user) => user.certificates, { onDelete: "CASCADE" })
  user!: Users;

  @ManyToOne(() => Course, (course) => course.certificates, { onDelete: "CASCADE" })
  course!: Course;

  @Column()
  score!: number;

  @Column({ unique: true })
  code!: string; // unique verification code

  @Column({ nullable: true })
  certificateUrl!: string; // cloudinary link or pdf path

  @CreateDateColumn()
  issuedAt!: Date;
}
