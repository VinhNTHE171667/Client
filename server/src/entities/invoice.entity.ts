import {
  Entity,
  PrimaryGeneratedColumn,
  ManyToOne,
  JoinColumn,
  Column,
  OneToMany,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Appointment } from './appointment.entity';
import { Customer } from './customer.entity';
import { InvoiceDetail } from './invoiceDetail.entity';
import { Voucher } from './voucher.entity';
import { Internal } from './internal.entity';

@Entity()
export class Invoice {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => Customer, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'customerId' })
  customer: Customer;

  @Column()
  customerId: string;

  @ManyToOne(() => Appointment, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'appointmentId' })
  appointment: Appointment;

  @Column()
  appointmentId: string;

  @OneToMany(() => InvoiceDetail, (detail) => detail.invoice, { cascade: true })
  details: InvoiceDetail[];

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  total_amount: number;

  @Column({
    type: 'enum',
    enum: ['pending', 'confirmed', 'paid', 'cancelled', 'completed'],
    default: 'pending',
  })
  status: 'pending' | 'confirmed' | 'paid' | 'cancelled' | 'completed';

  @Column({
    type: 'enum',
    enum: ['unpaid', 'paid', 'refunded'],
    default: 'unpaid',
  })
  payment_status: 'unpaid' | 'paid' | 'refunded';

  @Column({ nullable: true })
  invoice_type: 'deposit' | 'final';

  @Column({ nullable: true })
  payment_method?: string;

  @ManyToOne(() => Internal, { nullable: true }) 
  @JoinColumn({ name: 'cashierId' })
  cashier?: Internal;

  @Column({ nullable: true })
  cashierId?: string; 

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @ManyToOne(() => Voucher, { nullable: true })
  @JoinColumn({ name: 'voucherId' })
  voucher?: Voucher;

  @Column({ nullable: true })
  voucherId?: string;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  total: number;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  discount: number;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  finalAmount: number;
}