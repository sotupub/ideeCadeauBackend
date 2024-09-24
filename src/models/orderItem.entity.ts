import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, OneToMany } from "typeorm";
import { Order } from "./order.entity";
import { Product } from "./product.entity";
import { Exclude } from "class-transformer";
import { Review } from "./review.entity";

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

  @OneToMany(() => Review, (review) => review.orderItem)
  reviews: Review[];

  @Column({ type: "varchar", length: 40000, nullable: true })
  image?: string;
}