import {Column, Entity, ManyToMany, ManyToOne, OneToMany, PrimaryGeneratedColumn} from "typeorm";
import {OfficeDAO} from "./officeDAO";
import { ReportDAO } from "./reportDAO";

export enum StaffRole {
    ADMIN = "Admin",
    MPRO = "Municipal Public Relations Officer",
    MA = "Municipal Administrator",
    TOSM = "Technical Office Staff Member",
    EM = "External Maintainer"
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

    @Column({ type: "simple-enum", enum: StaffRole, nullable: false })
    role: StaffRole;

    @ManyToMany(() => OfficeDAO, (office) => office.members, {onDelete: "SET NULL", nullable: true})
    office: OfficeDAO[];

    @OneToMany(() => ReportDAO, (report) => report.assignedStaff)
    assignedReports: ReportDAO[];

}