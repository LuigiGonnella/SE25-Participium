import {AppDataSource} from "@database";
import {StaffDAO, StaffRole} from "@models/dao/staffDAO";
import {In, Repository} from "typeorm";
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
            const offices = await this.officeRepo.find({
                where: { category: OfficeCategory.MOO }
            });
        
            if (offices.length === 0) {
                throw new BadRequestError(
                    "No Municipal Organization Office found to assign to default admin"
                );
            }
            const defaultAdmin = this.repo.create({
                username: "admin",
                name: "Default",
                surname: "Admin",
                password: bcrypt.hashSync('admin123', 10),
                role: StaffRole.ADMIN,
                offices: offices
            });
            await this.repo.save(defaultAdmin);
            console.log("Default admin user created with username 'admin' and password 'admin123'");
        }
    }

    // get all staffs
    async getAllStaffs(isExternal?: boolean, category?: OfficeCategory): Promise<StaffDAO[]> {
        if (isExternal !== undefined || category !== undefined) {
            return await this.repo.find(
                {
                    where: {
                        ...(isExternal !== undefined ? { role: StaffRole.EM } : {}),
                        ...(category !== undefined ? { office: { category } } : {})
                    },
                    relations: ["office"]
                }
            )
        }
        return await this.repo.find({ relations: ["office"] });
    }

    // get staff by ID
    async getStaffById(id: number): Promise<StaffDAO | null> {
        return await this.repo.findOne({ where: { id }, relations: ["offices"] });
    }

    // get staff by username
    async getStaffByUsername(username: string): Promise<StaffDAO | null> {
        return await this.repo.findOne({ where: { username }, relations: ['offices'] });
    }

    // create new staff
    async createStaff(
        username: string,
        name: string,
        surname: string,
        password: string,
        role: StaffRole,
        officeNames: string[],
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

        if (!officeNames) {
            throw new BadRequestError(`${role} must be assigned to an office`);
        }
        
        const offices = await this.officeRepo.find({
            where: { name: In(officeNames) }
        });
    
        if (offices.length !== officeNames.length) {
            const found = offices.map(o => o.name);
            const missing = officeNames.filter(n => !found.includes(n));
            throw new BadRequestError(`Offices not found: ${missing.join(", ")}`);
        }
        

        const staff = this.repo.create({
            username,
            name,
            surname,
            password,
            role,
            offices,
        });
        
        return await this.repo.save(staff);
    }

    // update staff offices
    async updateStaffOffices(staffId: number, officeNames: string[]): Promise<StaffDAO> {
        const staff = await this.getStaffById(staffId);
        if (!staff) throw new BadRequestError("Staff not found");

        if (!Array.isArray(officeNames)) {
            throw new BadRequestError("officeNames must be an array");
        }

        const offices = await this.officeRepo.find({
            where: { name: In(officeNames) }
        });

        if (offices.length !== officeNames.length) {
            const foundNames = offices.map(o => o.name);
            const missing = officeNames.filter(n => !foundNames.includes(n));
            throw new BadRequestError(`Offices not found: ${missing.join(", ")}`);
        }

        staff.offices = offices;
        return await this.repo.save(staff);
    }

    // add staff offices
    async addOfficeToStaff(staffId: number, officeName: string): Promise<StaffDAO> {
        const staff = await this.getStaffById(staffId);
        if (!staff) throw new BadRequestError("Staff not found");

        const office = await this.officeRepo.findOne({ where: { name: officeName } });
        if (!office) throw new BadRequestError("Office not found");

        const alreadyHas = staff.offices.some(o => o.id === office.id);
        if (alreadyHas) {
            throw new BadRequestError(`Staff already has office ${officeName}`);
        }

        staff.offices.push(office);
        return await this.repo.save(staff);
    }

    // remove staff office
    async removeOfficeFromStaff(staffId: number, officeName: string): Promise<StaffDAO> {
        const staff = await this.getStaffById(staffId);
        if (!staff) throw new BadRequestError("Staff not found");

        const office = await this.officeRepo.findOne({ where: { name: officeName } });
        if (!office) throw new BadRequestError("Office not found");

        staff.offices = staff.offices.filter(o => o.id !== office.id);
        return await this.repo.save(staff);
    }
}