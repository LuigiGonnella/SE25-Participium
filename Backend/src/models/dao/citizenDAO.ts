import { Column, Entity, PrimaryGeneratedColumn, OneToMany } from "typeorm";
import { ReportDAO } from "./reportDAO";
import {PendingVerificationDAO} from "@dao/pendingVerificationDAO";

@Entity("citizen")
export class CitizenDAO {

    @PrimaryGeneratedColumn('increment', { type: 'int', unsigned: true })
    id: number;

    @Column({ type: 'varchar', unique: true, nullable: true })
    email: string | null;

    @Column({ unique: true, nullable: false })
    username: string;

    @Column({ nullable: false })
    name: string;

    @Column({ nullable: false })
    surname: string;

    @Column({ nullable: false })
    password: string;

    @Column({ nullable: true })
    profilePicture: string;

    @Column({ nullable: true })
    telegram_username: string;

    @Column({ nullable: false })
    receive_emails: boolean;

    @OneToMany(() => ReportDAO, (report) => report.citizen)
    reports: ReportDAO[];

    @OneToMany(() => PendingVerificationDAO, (pendingVerification) => pendingVerification.citizen, { cascade: true })
    pending_verifications: PendingVerificationDAO[];
}