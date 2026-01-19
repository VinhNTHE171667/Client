import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Appointment } from './appointment.entity';
import { Internal } from './internal.entity';

export enum RefundStatus {
  Pending = 'pending',
  Completed = 'completed',
  Failed = 'failed',
}

@Entity('appointment_refunds')
export class AppointmentRefund {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => Appointment, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'appointmentId' })
  appointment: Appointment;

  @Column()
  appointmentId: string;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  refundAmount: number;

  @Column({
    type: 'enum',
    enum: ['cash', 'qr', 'card'],
  })
  refundMethod: 'cash' | 'qr' | 'card';

  @Column({
    type: 'enum',
    enum: RefundStatus,
    default: RefundStatus.Pending,
  })
  refundStatus: RefundStatus;

  @Column({ nullable: true })
  refundReason?: string;

  @ManyToOne(() => Internal, { nullable: true })
  @JoinColumn({ name: 'processedBy' })
  staff?: Internal;

  @Column({ nullable: true })
  processedBy?: string;

  @Column({ type: 'timestamp', nullable: true })
  processedAt?: Date;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
