import {AppDataSource} from "@database";
import {StaffDAO, StaffRole} from "@models/dao/staffDAO";
import {Repository} from "typeorm";
import bcrypt from "bcrypt";
import AppError from "@errors/AppError";
import {findOrThrowNotFound, throwConflictIfFound} from "@utils";
import {OfficeDAO} from "@dao/officeDAO";

export class StaffRepository {
    private repo: Repository<StaffDAO>;
    private officeRepo: Repository<OfficeDAO>;

    constructor() {
        this.repo = AppDataSource.getRepository(StaffDAO);
        this.officeRepo = AppDataSource.getRepository(OfficeDAO);
    }

    async createDefaultAdminIfNotExists() {
        const adminExists = await this.repo.exists({ where: { role: StaffRole.ADMIN } });
        if (!adminExists) {
            const defaultAdmin = this.repo.create({
                username: "admin",
                name: "Default",
                surname: "Admin",
                password: bcrypt.hashSync('admin123', 10),
                role: StaffRole.ADMIN
            });
            await this.repo.save(defaultAdmin);
            console.log("Default admin user created with username 'admin' and password 'admin123'");
        }
    }

    // get all staffs
    async getAllStaffs(): Promise<StaffDAO[]> {
        return await this.repo.find({ relations: ["office"] });
    }

    // get staff by ID
    async getStaffById(id: number): Promise<StaffDAO | null> {
        return await this.repo.findOne({ where: { id }, relations: ["office"] });
    }

    // get staff by username
    async getStaffByUsername(username: string): Promise<StaffDAO | null> {
        return await this.repo.findOne({ where: { username }, relations: ['office'] });
    }

    // create new staff
    async createStaff(
        username: string,
        name: string,
        surname: string,
        password: string,
        role: StaffRole,
        officeName?: string
    ): Promise<StaffDAO> {
        if (!username || !name || !surname || !password) {
            throw new AppError("Invalid input data: username, name, surname, and password are required", 400);
        }

        username = username.trim();
        name = name.trim();
        surname = surname.trim();

        throwConflictIfFound(
            await this.repo.find({ where: { username } }),
            () => true,
            `Staff already exists with username ${username}`,
        )

        let office: OfficeDAO | undefined = undefined;
        
       
        if (!officeName && role != StaffRole.ADMIN) {
            throw new AppError(`${role} must be assigned to an office`, 400);
        }
        
        const foundOffice = await this.officeRepo.findOne({ where: { name: officeName } });
        
        if (!foundOffice) {
            throw new AppError(`Office with name ${officeName} not found`, 404);
        }
        
        office = foundOffice;
        

        const staff = this.repo.create({
            username,
            name,
            surname,
            password,
            role,
            office 
        });
        
        return await this.repo.save(staff);
    }
}