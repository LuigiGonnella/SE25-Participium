import {Column, Entity, ManyToOne, PrimaryGeneratedColumn} from "typeorm";
import {OfficeDAO} from "./officeDAO";

enum StaffRole {
    ADMIN = "admin",
    MPRO = "municipal public relations officer",
    MA = "municipal administrator",
    TOSM = "technical office staff member"
}

@Entity("staff")
export class StaffDAO {

    @PrimaryGeneratedColumn('increment', { type: 'int', unsigned: true })
    id: number;

    @Column({ unique: true, nullable: false })
    email: string;

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