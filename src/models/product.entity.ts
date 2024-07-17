import {Entity, PrimaryGeneratedColumn, Column, ManyToMany, JoinTable, ManyToOne, OneToMany} from "typeorm";
import { Category } from "./category.entity";
import { SubCategory } from "./subcategory.entity";
import { Model } from "./model.entity";
import { OrderItem } from "./orderitem.entity";
  
  @Entity()
  export class Product {
    @PrimaryGeneratedColumn("uuid")
    id: string;
  
    @Column()
    name: string;
  
    @Column()
    description: string;
  
    @Column({ type: 'decimal', precision: 10, scale: 2 })
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
  
    @Column()
    image: string;

    @ManyToOne(() => Model, model => model.id)
    model: Model;
    
    @OneToMany(() => OrderItem, orderItem => orderItem.product)
    orderItems: OrderItem[];



  }
  
  