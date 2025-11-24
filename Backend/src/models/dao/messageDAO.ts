import { Column, Entity, PrimaryGeneratedColumn, ManyToOne } from "typeorm";
import { StaffDAO } from "./staffDAO";
import {ReportDAO} from "@dao/reportDAO";

@Entity("message")
export class MessageDAO {
    @PrimaryGeneratedColumn('increment', { type: 'int', unsigned: true })
    id: number;

    @ManyToOne(() => ReportDAO, (report) => report.id)
    report: ReportDAO;

    @Column({ default: () => "CURRENT_TIMESTAMP" })
    timestamp: Date;

    @Column({ nullable: false, type: "text" })
    message: string;

    @ManyToOne(() => StaffDAO, (staff) => staff.username, {onDelete: "SET NULL", nullable: true})
    staff?: StaffDAO;

}