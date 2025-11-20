import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn } from "typeorm";


@Entity()
export class DocumentMedia {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column()
  documentId!: number;

  @Column()
  type!: "image" | "video";

  @Column()
  url!: string;

  @CreateDateColumn()
  createdAt!: Date;
}