import { Column, Entity, PrimaryGeneratedColumn, ManyToOne } from "typeorm";
import { CitizenDAO } from "./citizenDAO";
import { StaffDAO } from "./staffDAO";
import {ReportDAO} from "@dao/reportDAO";

@Entity("notification")
export class NotificationDAO {
    @PrimaryGeneratedColumn('increment', { type: 'int', unsigned: true })
    id: number;

    @ManyToOne(() => ReportDAO, (report) => report.id)
    report: ReportDAO;

    @Column({ default: () => "CURRENT_TIMESTAMP" })
    timestamp: Date;

    @Column({ nullable: false })
    title: string;

    @Column({ nullable: false, type: "text" })
    message: string;

    @ManyToOne(() => CitizenDAO, (citizen) => citizen.username, {onDelete: "SET NULL", nullable: true})
    citizen: CitizenDAO;

    @ManyToOne(() => StaffDAO, (staff) => staff.username, {onDelete: "SET NULL", nullable: true})
    staff: StaffDAO;

    @Column({ default: false })
    isRead: boolean;
}