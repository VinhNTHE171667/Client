import {
  Entity,
  PrimaryGeneratedColumn,
  ManyToOne,
  JoinColumn,
  Column,
  OneToMany,
  CreateDateColumn,
  UpdateDateColumn,
  DeleteDateColumn,
} from 'typeorm';
import { Customer } from './customer.entity';
import { Doctor } from './doctor.entity';
import { AppointmentDetail } from './appointmentDetails.entity';
import { Voucher } from './voucher.entity';
import { AppointmentHistory } from './appointmentHistory.entity';
import { Internal } from './internal.entity';
import { AppointmentHanle, AppointmentStatus } from './enums/appointment-status';

@Entity()
export class Appointment {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => Customer, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'customerId' })
  customer: Customer;

  @Column()
  customerId: string;

  @ManyToOne(() => Doctor, { nullable: true })
  @JoinColumn({ name: 'doctorId' })
  doctor?: Doctor;

  @Column({ nullable: true })
  doctorId?: string;

  @ManyToOne(() => Internal, { nullable: true, eager: true })
  @JoinColumn({ name: 'staffId' })
  staff?: Internal;

  @Column({ nullable: true })
  staffId?: string;

  @Column({ type: 'timestamp' })
  appointment_date: Date;

  @Column({
    type: 'enum',
    enum: AppointmentStatus,
    default: AppointmentStatus.Pending,
  })
  status: AppointmentStatus;

  @Column({
    type: 'enum',
    enum: AppointmentHanle
  })
  statusHanle?: AppointmentHanle;

  @OneToMany(() => AppointmentDetail, (detail) => detail.appointment, {
    cascade: true,
  })
  details: AppointmentDetail[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @DeleteDateColumn({ nullable: true })
  deletedAt?: Date;

  @ManyToOne(() => Voucher, { nullable: true })
  @JoinColumn({ name: 'voucherId' })
  voucher?: Voucher;

  @Column({ nullable: true })
  voucherId?: string;

  @Column({ nullable: true })
  cancelledAt?: Date;

  @Column({ nullable: true })
  cancelReason?: string;

  @Column({ nullable: true })
  rejectionReason?: string;

  @Column({ type: 'timestamp' })
  startTime: Date;

  @Column({ type: 'timestamp' })
  endTime: Date;

  @Column({ nullable: true })
  note?: string;

  @OneToMany(() => AppointmentHistory, (history) => history.appointment)
  histories: AppointmentHistory[];

  @Column({ nullable: true })
  orderCode?: number;

  @Column({ default: 'online' })
  appointmentType?: 'online' | 'offline';

  @Column({ nullable: true })
  paymentMethod?: 'cash' | 'qr' | 'card';

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  totalAmount: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  depositAmount: number;

  @Column({ type: 'boolean', default: false })
  isFeedbackGiven: boolean;

  @Column({ type: 'varchar', length: 255, nullable: true })
  reminderDoctor?: string;
}
