import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, CreateDateColumn } from "typeorm";
import { User } from "./user.entity";
import { Product } from "./product.entity";
import { OrderItem } from "./orderItem.entity";
import { EReview } from "./enums/EReview";

@Entity()
export class Review {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  rating: number;

  @Column()
  comment: string;

  @CreateDateColumn()
  createdAt: Date;

  @ManyToOne(() => User, (user) => user.reviews)
  user: User;

  @ManyToOne(() => Product, (product) => product.reviews)
  product: Product;

  @ManyToOne(() => OrderItem, (orderItem) => orderItem.reviews)
  orderItem: OrderItem;

  @Column({
    type: "enum",
    enum: EReview,
    default: EReview.PENDING
  })
  status: EReview;
}
