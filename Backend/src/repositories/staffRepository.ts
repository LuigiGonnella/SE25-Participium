import {AppDataSource} from "@database";
import {StaffDAO, StaffRole} from "@models/dao/staffDAO";
import {Repository} from "typeorm";
import bcrypt from "bcrypt";
import {findOrThrowNotFound, throwConflictIfFound} from "@utils";
import {OfficeCategory, OfficeDAO} from "@dao/officeDAO";
import {BadRequestError} from "@errors/BadRequestError";

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
            const office = findOrThrowNotFound(
                await this.officeRepo.find({ where: { category: OfficeCategory.MOO } }),
                () => true,
                "No Municipal Organization Office found to assign to default admin"
            )
            const defaultAdmin = this.repo.create({
                username: "admin",
                name: "Default",
                surname: "Admin",
                password: bcrypt.hashSync('admin123', 10),
                role: StaffRole.ADMIN,
                office: office
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
        officeName: string
    ): Promise<StaffDAO> {
        if (!username || !name || !surname || !password) {
            throw new BadRequestError("Invalid input data: username, name, surname, and password are required");
        }

        username = username.trim();
        name = name.trim();
        surname = surname.trim();

        throwConflictIfFound(
            await this.repo.find({ where: { username } }),
            () => true,
            `Staff already exists with username ${username}`,
        )
       
        if (!officeName) {
            throw new BadRequestError(`${role} must be assigned to an office`);
        }
        
        const office = findOrThrowNotFound(
            await this.officeRepo.find({ where: { name: officeName } }),
            () => true,
            `Office with name ${officeName} not found`
        );
        

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