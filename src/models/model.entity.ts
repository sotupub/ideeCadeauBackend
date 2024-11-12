import { Entity, PrimaryGeneratedColumn, Column } from "typeorm";

@Entity()
export class Model {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @Column()
  name: string;

  @Column()
  image: string;

  @Column({nullable: true})
  options: string; 
}
