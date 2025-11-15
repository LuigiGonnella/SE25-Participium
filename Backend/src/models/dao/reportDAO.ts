import { Column, Entity, PrimaryGeneratedColumn, ManyToOne } from "typeorm";
import { CitizenDAO } from "./citizenDAO";
import { OfficeCategory } from "./officeDAO";
import { StaffDAO } from "./staffDAO";

enum Status {
    PENDING = "Pending",
    ASSIGNED = "Assigned",
    IN_PROGRESS = "In Progress",
    SUSPENDED = "Suspended",
    REJECTED = "Rejected",
    RESOLVED = "Resolved",
}

@Entity("report")
export class ReportDAO {

    @PrimaryGeneratedColumn('increment', { type: 'int', unsigned: true })
    id: number;

    @ManyToOne(() => CitizenDAO, (citizen) => citizen.reports, {onDelete: "SET NULL", nullable: true})
    citizen: CitizenDAO;

    @Column( "datetime", { nullable: false, default: () => "CURRENT_TIMESTAMP" })
    timestamp?: Date;

    @Column({ type: "simple-enum", enum: Status, nullable: false })
    status: Status;

    @Column({ nullable: false })
    title: string;

    @Column({ nullable: false })
    description: string;

    @Column({ type: "simple-enum", enum: OfficeCategory, unique: true, nullable: false })
    category: OfficeCategory;

    @Column({ nullable: false, type: "double" })
    latitude: number;

    @Column({ nullable: false, type: "double" })
    longitude: number;

    @Column({ nullable: false })
    photo1: string;

    @Column({ nullable: true })
    photo2?: string;

    @Column({ nullable: true })
    photo3?: string;

    @Column({ nullable: false, default: false })
    anonymous: boolean;

    @Column({ nullable: true, type: "text" })
    comment?: string;

    @ManyToOne(() => StaffDAO, { nullable: true })
    assignedStaff?: StaffDAO;

}