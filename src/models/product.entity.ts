import {Entity, PrimaryGeneratedColumn, Column, ManyToMany, JoinTable, ManyToOne, OneToMany} from "typeorm";
import { Category } from "./category.entity";
import { SubCategory } from "./subcategory.entity";
import { Model } from "./model.entity";
import { OrderItem } from "./orderItem.entity";
import { Review } from "./review.entity";
import { IsNumber, IsString } from "class-validator";
  
  @Entity()
  export class Product {
    @PrimaryGeneratedColumn("uuid")
    id: string;
    
    @IsString()
    @Column()
    name: string;
  
    @Column()
    @IsString()
    description: string;
  
    @Column({ type: 'decimal', precision: 10, scale: 2 })
    @IsNumber()
    price: number;

    @Column({ type: 'decimal', precision: 10, scale: 2 , nullable: true})
    oldprice: number;

    @ManyToMany(() => Category)
    @JoinTable({
      name: "product_categories",
      joinColumn: { name: "productId", referencedColumnName: "id" },
      inverseJoinColumn: { name: "categoryId", referencedColumnName: "id" }
    })
    categories: Category[];
  
    @ManyToMany(() => SubCategory)
    @JoinTable({
      name: "product_subcategories",
      joinColumn: { name: "productId", referencedColumnName: "id" },
      inverseJoinColumn: { name: "subCategoryId", referencedColumnName: "id" }
    })
    subCategories?: SubCategory[];
  
    @Column("longtext")
    images: string[];  

    @Column()
    @IsNumber()
    stock: number;

    @Column()
    visible: boolean;

    @Column()
    stockAvailability: boolean;

    @ManyToOne(() => Model, model => model.id)
    model: Model;
    
    @OneToMany(() => OrderItem, orderItem => orderItem.product)
    orderItems: OrderItem[];

    @OneToMany(() => Review, (review) => review.product)
    reviews: Review[];

    @Column({ type: "varchar", length: 255, nullable: true })
    options?: string;
  }
  
  