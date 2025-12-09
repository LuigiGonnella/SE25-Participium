import {Column, Entity, ManyToOne, PrimaryColumn, JoinColumn} from "typeorm";
import {CitizenDAO} from "@dao/citizenDAO";


@Entity("pending_verifications")
export class PendingVerificationDAO {

    @PrimaryColumn({ type: 'int', unsigned: true })
    citizenId: number;

    @ManyToOne(() => CitizenDAO, citizen => citizen.pending_verifications, { onDelete: 'CASCADE' })
    @JoinColumn({ name: "citizenId" })
    citizen: CitizenDAO;

    @PrimaryColumn({ type: "simple-enum", enum: ["email", "telegram"] })
    type: "email" | "telegram"

    @Column()
    valueToVerify: string

    @Column()
    verificationCode: string

    @Column({ type: "datetime" })
    expiresAt: Date
}