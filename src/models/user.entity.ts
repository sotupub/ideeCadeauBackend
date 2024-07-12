import { Entity, PrimaryGeneratedColumn, Column } from "typeorm";
import { ERole } from "./enums/ERole";

@Entity()
export class User {
    @PrimaryGeneratedColumn("uuid")
    id: string;

    @Column({nullable: true})
    firstname: string;

    @Column({nullable: true})
    lastname: string;

    @Column()
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

}
