import {AppDataSource} from "@database";
import {CitizenDAO} from "@models/dao/citizenDAO";
import {throwConflictIfFound} from "@utils";
import {Repository} from "typeorm";
import AppError from "@models/errors/AppError";
import bcrypt from "bcrypt";

export class CitizenRepository {
    private readonly repo: Repository<CitizenDAO>;

    constructor() {
        this.repo = AppDataSource.getRepository(CitizenDAO);
    }

    async createDefaultCitizensIfNotExist(count: number = 3): Promise<void> {
        for (let i = 1; i <= count; i++) {
            const username = `cit_${i}`;
            const email = `example${i}@example.com`;
            const passwordPlain = `cit123`;

            const existing = await this.repo.findOne({
                where: [
                    { email },
                    { username }
                ]
            });

            if (existing) {
                console.log(`Default citizen ${username} already exists.`);
            } else {
                const newCitizen = this.repo.create({
                    email,
                    username,
                    name: `Default${i}`,
                    surname: "Citizen",
                    password: bcrypt.hashSync(passwordPlain, 10),
                    receive_emails: false,
                });
                await this.repo.save(newCitizen);
                console.log(`Default citizen ${username} created with password 'cit123'.`);
            }
        }
    }

    // get all citizens
    async getAllCitizens(): Promise<CitizenDAO[]> {
        return await this.repo.find();
    }

    // get citizen by ID
    async getCitizenById(id: number): Promise<CitizenDAO | null> {
        return await this.repo.findOne({ where: { id } });
    }

    // get citizen by email
    async getCitizenByEmail(email: string): Promise<CitizenDAO | null> {
        return await this.repo.findOne({ where: { email } });
    }

    // get citizen by username
    async getCitizenByUsername(username: string): Promise<CitizenDAO | null> {
        return await this.repo.findOne({ where: { username } });
    }

    // create new citizen
    async createCitizen(
        email: string,
        username: string,
        name: string,
        surname: string,
        password: string,
        receive_emails: boolean = false //by default it is false, then the citizen can change it
    ): Promise<CitizenDAO> {
        if (!email || !username || !name || !surname || !password) {
            throw new AppError("Invalid input data: email, username, name, surname, and password are required", 400);
        }
        
        email = email.trim();
        username = username.trim();
        name = name.trim();
        surname = surname.trim();

       
        throwConflictIfFound(
            await this.repo.find({ where: { email }}),
            () => true,
            `Citizen already exists with email ${email}`,
        );

        throwConflictIfFound(
            await this.repo.find({ where: { username }}),
            () => true,
            `Citizen already exists with username ${username}`,
        );

        // Save citizen without email (email will be set after verification)
        return await this.repo.save({
            email: null, // Email is null until verified
            username,
            name,
            surname,
            password,
            receive_emails
        });
    }

    async updateCitizen(
        username: string,
        fields: {
            telegram_username?: string;
            receive_emails?: boolean;
            profilePicture?: string;
        }
    ): Promise<CitizenDAO> {

        const citizen = await this.getCitizenByUsername(username);
        if (!citizen) {
            throw new AppError(`Citizen with username ${username} not found`, 404);
        }

        if (fields.telegram_username !== undefined) {
            citizen.telegram_username = fields.telegram_username;
        }

        if (fields.receive_emails !== undefined) {
            citizen.receive_emails = fields.receive_emails;
        }

        if (fields.profilePicture !== undefined) {
            citizen.profilePicture = fields.profilePicture;
        }

        return await this.repo.save(citizen);
    }

    async getCitizenByTelegramUsername(telegram_username: string): Promise<CitizenDAO | null> {
        return await this.repo.findOne({ where: { telegram_username } });
    }
}