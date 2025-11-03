import {Column, Entity, OneToMany, PrimaryGeneratedColumn} from "typeorm";
import {StaffDAO} from "./staffDAO";

@Entity("office")
export class OfficeDAO {

    @PrimaryGeneratedColumn('increment', { type: 'int', unsigned: true })
    id: number;

    @Column({ unique: true, nullable: false })
    name: string;

    @Column()
    description: string;

    @OneToMany(() => StaffDAO, (staff) => staff.office)
    members: StaffDAO[];
}