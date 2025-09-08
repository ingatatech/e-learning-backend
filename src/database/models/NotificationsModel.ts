import { Users } from './UserModel';
import { Entity, PrimaryGeneratedColumn, Column, ManyToOne } from 'typeorm';

@Entity()
export class Notification {
  @PrimaryGeneratedColumn()
  id!: number;

  @ManyToOne(() => Users, user => user.notifications, { onDelete: 'CASCADE' })
  user!: Users;

  @Column()
  message!: string;

  @Column({ default: false })
  isRead!: boolean;

  @Column({ type: 'varchar', nullable: true })
  link?: string;

  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  createdAt!: Date;

  // Optional: Type of notification (e.g., file_uploaded, user_added, etc.)
  @Column({ nullable: true })
  type!: string;
}