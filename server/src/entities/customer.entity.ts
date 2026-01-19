import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  DeleteDateColumn,
  UpdateDateColumn,
  OneToOne,
  OneToMany,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { Cart } from './cart.entity';
import { Appointment } from './appointment.entity';
import { Invoice } from './invoice.entity';
import { CustomerVoucher } from './customerVoucher.entity';
import { Membership } from './membership.entity';
import { Gender } from './enums/gender.enum';
import { CustomerType } from './enums/customer-type.enum';
@Entity()
export class Customer {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ nullable: true })
  avatar?: string;

  @Column()
  full_name: string;

  @Column({ type: 'enum', enum: Gender, default: Gender.Male })
  gender: Gender;

  @Column({ type: 'date', nullable: true })
  birth_date: Date;

  @Column()
  password: string;

  @Column({ nullable: true })
  refreshToken?: string;

  @Column({ unique: true })
  email: string;

  @Column({ nullable: true })
  phone: string;

  @Column({ nullable: true })
  address: string;

  @Column({
    type: 'enum',
    enum: CustomerType,
    default: CustomerType.Regular,
  })
  customer_type: CustomerType;

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  total_spent: number;

  @CreateDateColumn({})
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @DeleteDateColumn({ nullable: true })
  deletedAt?: Date;

  @OneToOne(() => Cart, (cart) => cart.customer, { cascade: true })
  cart: Cart;

  @OneToMany(() => Appointment, (appointment) => appointment.customer)
  appointments: Appointment[];

  @OneToMany(() => Invoice, (invoice) => invoice.customer)
  invoices: Invoice[];

  @OneToMany(() => CustomerVoucher, (cv) => cv.customer)
  vouchers: CustomerVoucher[];

  @ManyToOne(() => Membership, (membership) => membership.customers, {
    nullable: true,
  })
  @JoinColumn({ name: 'membershipId' })
  membership?: Membership;

  @Column({ nullable: true })
  membershipId?: string;

  @Column({ default: true })
  isActive: boolean;

  @Column({ default: false })
  isVerified: boolean;

  @Column({ type: 'varchar', length: 255, nullable: true })
  resetToken?: string | null;

  @Column({ type: 'timestamp', nullable: true })
  resetTokenExpire?: Date | null;

  @Column({ type: 'varchar', length: 255, nullable: true })
  emailVerificationToken?: string | null;

  @Column({ type: 'timestamp', nullable: true })
  emailVerificationTokenExpire?: Date | null;

  @Column({ default: false })
  isEmailVerified: boolean;
}
