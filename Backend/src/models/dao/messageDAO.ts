import { Column, Entity, PrimaryGeneratedColumn, ManyToOne, JoinColumn } from "typeorm";
import { StaffDAO } from "./staffDAO";
import {ReportDAO} from "@dao/reportDAO";

@Entity("message")
export class MessageDAO {
    @PrimaryGeneratedColumn('increment', { type: 'int', unsigned: true })
    id: number;

    @ManyToOne(() => ReportDAO, (report) => report.messages, {onDelete: "CASCADE", nullable: false})
    report: ReportDAO;

    @Column({ default: () => "CURRENT_TIMESTAMP" })
    timestamp: Date;

    @Column({ nullable: false, type: "text" })
    message: string;

    @ManyToOne(() => StaffDAO, {onDelete: "SET NULL", nullable: true})
    @JoinColumn({ name: "staffId" })
    staff?: StaffDAO;

    @Column({ nullable: false, default: false})
    isPrivate: boolean;
}