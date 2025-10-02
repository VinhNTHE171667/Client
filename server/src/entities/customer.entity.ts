import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  DeleteDateColumn,
  UpdateDateColumn,
} from 'typeorm';

export enum Gender {
  Male = 'male',
  Female = 'female',
  Other = 'other',
}

export enum CustomerType {
  Regular = 'regular',
  Member = 'member',
  Vip = 'vip',
}

@Entity()
export class Customer {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  full_name: string;

  @Column({ type: 'enum', enum: Gender, default: Gender.Male })
  gender: Gender;

  @Column({ type: 'date', nullable: true })
  birth_date: Date;

  @Column()
  password: string;

  @Column({ default: true })
  isActive: boolean;

  @Column({ default: false })
  isVerified: boolean;

  @Column({ default: false })
  isDeleted: boolean;

  @Column()
  phone: string;

  @Column({ unique: true })
  email: string;

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

  @Column({ nullable: true })
  refreshToken?: string;

  @CreateDateColumn({})
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @DeleteDateColumn({ nullable: true })
  deletedAt?: Date;
}
