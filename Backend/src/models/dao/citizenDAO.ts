import { Column, Entity, PrimaryGeneratedColumn, OneToMany } from "typeorm";
import { ReportDAO } from "./reportDAO";

@Entity("citizen")
export class CitizenDAO {

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
    profilePicture: string;

    @Column({ nullable: true })
    telegram_username: string;

    @Column({ nullable: false })
    receive_emails: boolean;

    @OneToMany(() => ReportDAO, (report) => report.citizen)
    reports: ReportDAO[];

}