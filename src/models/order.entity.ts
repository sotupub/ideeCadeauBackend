import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, OneToMany, JoinTable } from "typeorm";
import { User } from "./user.entity";
import { EOrder } from "./enums/EOrder";
import { OrderItem } from "./orderItem.entity";

@Entity()
export class Order {
  @PrimaryGeneratedColumn()
  id: string;

  @ManyToOne(() => User, user => user.orders)
  user: User;

  @OneToMany(() => OrderItem, orderItem => orderItem.order, { cascade: true })
  @JoinTable()
  orderItems: OrderItem[];

  @Column("decimal")
  total: number;

  @Column({
    type: "enum",
    enum: EOrder,
    default: EOrder.PENDING
  })
  status: EOrder;

  @Column("timestamp")
  createdAt: Date;
}