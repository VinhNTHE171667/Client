import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
} from 'typeorm';

@Entity()
export class Admin {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  username: string;

  @Column()
  full_name: string;

  @Column()
  password: string;

  @Column({ default: true })
  isActive: boolean;

  @Column()
  refreshToken: string;

  @CreateDateColumn({})
  createdAt: Date;

  @CreateDateColumn({})
  updatedAt: Date;
}
