import {Column, Entity, ManyToOne, PrimaryGeneratedColumn} from "typeorm";
import {OfficeDAO} from "./officeDAO";

export enum StaffRole {
    ADMIN = "Admin",
    MPRO = "Municipal Public Relations Officer",
    MA = "Municipal Administrator",
    TOSM = "Technical Office Staff Member"
}

@Entity("staff")
export class StaffDAO {

    @PrimaryGeneratedColumn('increment', { type: 'int', unsigned: true })
    id: number;

    @Column({ unique: true, nullable: false })
    username: string;

    @Column({ nullable: false })
    name: string;

    @Column({ nullable: false })
    surname: string;

    @Column({ nullable: false })
    password: string;

    @Column({ nullable: true })
    role: StaffRole;

    @ManyToOne(() => OfficeDAO, (office) => office.members, {onDelete: "SET NULL", nullable: true})
    office: OfficeDAO;

}