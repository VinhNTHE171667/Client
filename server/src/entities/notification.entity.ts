import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  DeleteDateColumn,
  Index,
} from 'typeorm';
import { NotificationType } from './enums/notification-type.enum'; 

@Entity('notifications')
@Index(['userId', 'userType']) 
export class Notification {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ nullable: false })
  title: string;

  @Column('text', { nullable: false })
  content: string;

  @Column({
    type: 'enum',
    enum: NotificationType,
    default: NotificationType.Info,
  })
  type: NotificationType;

  @Column({ nullable: false })
  userId: string;

  @Column({ nullable: false })
  userType: string; 

  @Column({ default: false })
  isRead: boolean;

  @Column({ nullable: true })
  actionUrl?: string; 

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @DeleteDateColumn({ nullable: true })
  deletedAt?: Date;

  @Column({ nullable: true })
  relatedId?: string; 

  @Column({ nullable: true })
  relatedType?: string; 
}