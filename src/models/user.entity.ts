import { Entity, PrimaryGeneratedColumn, Column, OneToMany } from "typeorm";
import { ERole } from "./enums/ERole";
import { Order } from "./order.entity";
import { Review } from "./review.entity";

@Entity()
export class User {
    @PrimaryGeneratedColumn("uuid")
    id: string;

    @Column({nullable: true})
    firstname: string;

    @Column({nullable: true})
    lastname: string;

    @Column({nullable: true})
    email: string;

    @Column()
    password: string;

    @Column()
    phonenumber: number;

    @Column({
        type: "enum",
        enum: ERole,
        default: ERole.CLIENT
    })
    role: ERole;

    @Column({ nullable: true })
    resetCode: string;

    @Column({ nullable: true })
    resetCodeExpiration: Date;

    @OneToMany(() => Order, order => order.user)
    orders: Order[];

    @OneToMany(() => Review, (review) => review.user)
    reviews: Review[];

    @Column({ type: "varchar", length: 255, nullable: true })
    address?: string;

    @Column({ type: "varchar", length: 255, nullable: true })
    city?: string;

    @Column({ type: "varchar", length: 255, nullable: true })
    zipCode?: string;

    @Column({ type: "varchar", length: 255, nullable: true })
    country?: string;
    
}
