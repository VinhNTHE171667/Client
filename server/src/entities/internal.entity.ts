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
import { Role } from './role.entity';

@Entity()
export class Internal {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ nullable: true })
  avatar?: string;

  @Column({ nullable: true })
  full_name: string;

  @Column({ nullable: true })
  gender?: string;

  @Column({ nullable: true })
  phone: string;

  @Column()
  email: string;

  @Column()
  password: string;

  @ManyToOne(() => Role, (role) => role.roles, { eager: true })
  @JoinColumn({ name: 'roleId' })
  role: Role;

  @Column({ nullable: true })
  refreshToken?: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @DeleteDateColumn({ nullable: true })
  deletedAt?: Date;

  @Column({ default: true })
  isActive: boolean;
}
