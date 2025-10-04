import {
  Column,
  CreateDateColumn,
  DeleteDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { RoleStaff } from './roleStaff.entity';

@Entity()
export class Staff {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ nullable: true })
  avatar?: string;

  @Column()
  full_name: string;

  @Column()
  phone: string;

  @Column()
  email: string;

  @ManyToOne(() => RoleStaff, (role) => role.staffs, { eager: true })
  @JoinColumn({ name: 'roleId' })
  role: RoleStaff;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @DeleteDateColumn({ nullable: true })
  deletedAt?: Date;

  @Column({ default: true })
  isActive: boolean;
}
