import {
  Entity,
  PrimaryGeneratedColumn,
  ManyToOne,
  JoinColumn,
  Column,
  CreateDateColumn,
} from 'typeorm';
import { Appointment } from './appointment.entity';
import { Customer } from './customer.entity';
import { Internal } from './internal.entity';

@Entity()
export class AppointmentHistory {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => Appointment, (appointment) => appointment.histories, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'appointmentId' })
  appointment: Appointment;

  @Column()
  appointmentId: string;

  @Column({
    type: 'enum',
    enum: ['pending', 'confirmed', 'completed', 'cancelled'],
  })
  oldStatus: 'pending' | 'confirmed' | 'completed' | 'cancelled';

  @Column({
    type: 'enum',
    enum: ['pending', 'confirmed', 'completed', 'cancelled'],
  })
  newStatus: 'pending' | 'confirmed' | 'completed' | 'cancelled';

  @ManyToOne(() => Internal, { nullable: true })
  @JoinColumn({ name: 'changedByStaffId' })
  changedByStaff?: Internal;

  @ManyToOne(() => Customer, { nullable: true })
  @JoinColumn({ name: 'changedByCustomerId' })
  changedByCustomer?: Customer;

  @Column({ nullable: true })
  note?: string;

  @Column({ nullable: true })
  reason?: string;

  @CreateDateColumn()
  changedAt: Date;
}
