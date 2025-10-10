import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
  UpdateDateColumn,
} from "typeorm";
import { Users } from "./UserModel";

@Entity("documents")
export class Document {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ type: "varchar", length: 255 })
  title!: string;

  @Column({ type: "text", nullable: true })
  content!: string;

  @Column()
  instructorId!: number;

  @ManyToOne(() => Users, (user) => user.documents, {
    onDelete: "CASCADE",
    eager: false,
  })
  @JoinColumn({ name: "instructorId" })
  instructor!: Users;

  @Column({
    type: "enum",
    enum: ["draft", "submitted", "approved", "rejected"],
    default: "draft",
  })
  status!: "draft" | "submitted" | "approved" | "rejected";

  @Column({ type: "timestamp", nullable: true })
  submittedAt?: Date;

  @Column({ type: "timestamp", nullable: true })
  reviewedAt?: Date;

  @Column({ type: "int", nullable: true })
  reviewedBy?: number;

  @Column({ type: "text", nullable: true })
  reviewNotes?: string;

  @Column({ nullable: true })
  fileUrl?: string


  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;

  @Column({ type: "timestamp", default: () => "CURRENT_TIMESTAMP" })
  lastEditedAt!: Date;
}
