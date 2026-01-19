import { Entity, PrimaryGeneratedColumn, Column, OneToMany } from 'typeorm';
import { Internal } from './internal.entity';

@Entity()
export class Role {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ unique: true })
  name: string;

  @Column({ nullable: true })
  description: string;

  @OneToMany(() => Internal, (internal) => internal.role)
  roles: Internal[];
}
