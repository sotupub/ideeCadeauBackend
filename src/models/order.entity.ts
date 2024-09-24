import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, OneToMany, JoinTable } from "typeorm";
import { User } from "./user.entity";
import { EOrder } from "./enums/EOrder";
import { OrderItem } from "./orderItem.entity";
import { EPayment } from "./enums/EPayment";

@Entity()
export class Order {
  @PrimaryGeneratedColumn()
  id: string;

  @ManyToOne(() => User, user => user.orders)
  user: User;

  @OneToMany(() => OrderItem, orderItem => orderItem.order, { cascade: true })
  @JoinTable()
  orderItems: OrderItem[];

  @Column("decimal", { precision: 10, scale: 2 })
  total: number;

  @Column({
    type: "enum",
    enum: EOrder,
    default: EOrder.PENDING
  })
  status: EOrder;

  @Column("timestamp")
  createdAt: Date;

  @Column()
  adress: string;

  @Column({
    type: "enum",
    enum: EPayment,
    nullable: true
  })
  paymentmode: EPayment;

  @Column({ type: "varchar", length: 255, nullable: true })
  country?: string;

  @Column({ type: "varchar", length: 255, nullable: true })
  zipCode?: string;

  @Column({ type: "varchar", length: 255, nullable: true })
  city?: string;

  @Column({ type: "varchar", length: 255, nullable: true })
  comment?: string;
}