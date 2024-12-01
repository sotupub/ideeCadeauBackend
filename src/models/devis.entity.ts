import { Entity, PrimaryGeneratedColumn, Column } from "typeorm";

@Entity()
export class Devis {
    @PrimaryGeneratedColumn("uuid")
    id: string;

    @Column()
    name: string;

    @Column({nullable: true})
    company: string;

    @Column()
    email: string;

    @Column()
    phonenumber: number;

    @Column()
    message: string;

    @Column({ type: "timestamp", default: () => "CURRENT_TIMESTAMP" })
    createdAt: Date;

    @Column({default: false})
    read: boolean;

}
