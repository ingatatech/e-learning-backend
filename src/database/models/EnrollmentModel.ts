import { Entity, PrimaryColumn, Column, CreateDateColumn } from "typeorm";

@Entity()
export class Enrollment {
  @PrimaryColumn()
  id!: string; // e.g., "enr_xyz123"

  @Column()
  userId!: string;

  @Column()
  courseId!: string;

  @CreateDateColumn()
  enrolledAt!: Date;

  @Column()
  status!: string; // e.g., "active", "completed"

  @Column({ default: 0 })
  progress!: number; // percentage or points
}
