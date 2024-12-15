import { Entity, PrimaryGeneratedColumn, Column, ManyToMany, JoinTable } from "typeorm";
import { EWidget } from "./enums/EWidget";
import { Product } from "./product.entity";

@Entity()
export class Widget {
    @PrimaryGeneratedColumn()
    id: string;

    @Column()
    name: string;

    @Column({type: "enum", enum: EWidget})
    type:EWidget;

    @Column()
    visible: boolean;

    @ManyToMany(() => Product)
    @JoinTable()
    products: Product[];
}
