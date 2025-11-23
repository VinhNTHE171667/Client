// src/entities/cartDetails.entity.ts (Update entity to allow null explicitly)
import {
  Entity,
  PrimaryGeneratedColumn,
  ManyToOne,
  JoinColumn,
  Column,
} from 'typeorm';
import { Cart } from './cart.entity';
import { Service } from './service.entity';

@Entity()
export class CartDetail {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => Cart, (cart) => cart.details, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'cartId' })
  cart: Cart;

  @Column()
  cartId: string;

  @ManyToOne(() => Service, { eager: true })
  @JoinColumn({ name: 'serviceId' })
  service: Service;

  @Column()
  serviceId: string;

  @Column({ default: 1 })
  quantity: number;

  @Column({ nullable: true, type: 'varchar', length: 255 }) 
  doctorId?: string | null; 

  // @Column({ type: 'decimal', precision: 10, scale: 2 })
  // price: number;
}