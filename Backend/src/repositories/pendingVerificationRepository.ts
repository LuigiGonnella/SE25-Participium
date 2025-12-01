import {PendingVerificationDAO} from "@dao/pendingVerificationDAO";
import {MoreThan, Repository} from "typeorm";
import {AppDataSource} from "@database";
import {findOrThrowNotFound} from "@utils";
import {CitizenDAO} from "@dao/citizenDAO";
import {InternalServerError} from "@errors/InternalServerError";
import { getDigitalCode } from 'node-verification-code';
import {ConflictError} from "@errors/ConflictError";

export class PendingVerificationRepository {
    private repo: Repository<PendingVerificationDAO>;
    private citizenRepo: Repository<CitizenDAO>;

    constructor() {
        this.repo = AppDataSource.getRepository(PendingVerificationDAO);
        this.citizenRepo = AppDataSource.getRepository(CitizenDAO);
    }

    async createPendingVerification(
        citizen: CitizenDAO,
        valueToVerify: string,
        type: "email" | "telegram"
    ): Promise<PendingVerificationDAO> {

        const existing = await this.repo.find({
            where: {
                citizenId: citizen.id,
                type: type
            },
        });

        if (existing.length > 1) {
            throw new InternalServerError("Multiple pending verifications found for the same citizen and type");
        } else if (existing.length === 1 && existing[0].expiresAt > new Date()) {
            throw new ConflictError("A pending verification already exists for this citizen and type");
        }


        const expiresAt = new Date(Date.now() + 2 * 60 * 1000); // 30 minutes from now

        const verificationCode = getDigitalCode(6).toString();

        return await this.repo.save({
            citizen,
            type,
            valueToVerify,
            verificationCode,
            expiresAt
        });
    }

    async verifyPendingVerification(username: string, code: string, type: "email" | "telegram"): Promise<void> {
        const pendingVerification = findOrThrowNotFound(
            await this.repo.find({
                where: {
                    valueToVerify: username,
                    verificationCode: code,
                    type: type,
                    expiresAt: MoreThan(new Date())
                },
                relations: ["citizen"]
            }),
            () => true,
            `The verification code is invalid or has expired`,
        );
        // If found, update citizen
        const citizen = pendingVerification.citizen;
        if (type === "email") {
            //citizen.email = pendingVerification.valueToVerify;
        } else if (type === "telegram") {
            citizen.telegram_username = pendingVerification.valueToVerify;
        }
        if (!(await this.citizenRepo.save(citizen)) || !(await this.repo.remove(pendingVerification))) {
            throw new InternalServerError("Failed to verify pending verification");
        }
    }
}