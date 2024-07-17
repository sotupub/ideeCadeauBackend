import { Entity, PrimaryGeneratedColumn, Column, ManyToOne } from "typeorm";
import { Order } from "./order.entity";
import { Product } from "./product.entity";
import { Exclude } from "class-transformer";

@Entity()
export class OrderItem {
  @PrimaryGeneratedColumn()
  id: string;

  @ManyToOne(() => Order, order => order.orderItems)
  @Exclude({ toPlainOnly: true })
  order: Order;

  @ManyToOne(() => Product, product => product.orderItems)
  product: Product;

  @Column("int")
  quantity: number;

  @Column("decimal")
  price: number;
}