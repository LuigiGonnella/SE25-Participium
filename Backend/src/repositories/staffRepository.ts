import {AppDataSource} from "@database";
import {StaffDAO, StaffRole} from "@models/dao/staffDAO";
import {In, Not, Repository} from "typeorm";
import bcrypt from "bcrypt";
import {throwConflictIfFound} from "@utils";
import {OfficeCategory, OfficeDAO} from "@dao/officeDAO";
import {BadRequestError} from "@errors/BadRequestError";

export class StaffRepository {
    private readonly repo: Repository<StaffDAO>;
    private readonly officeRepo: Repository<OfficeDAO>;

    constructor() {
        this.repo = AppDataSource.getRepository(StaffDAO);
        this.officeRepo = AppDataSource.getRepository(OfficeDAO);
    }

    private async createDefaultTOSMForOffice(office: OfficeDAO, key: string | undefined) {
        const tosmsExist = await this.repo.exists({
            where: {
                role: StaffRole.TOSM,
                offices: {id: office.id, isExternal: false}
            }
        });
        if (!tosmsExist) {
            const defaultTOSM = this.repo.create({
                username: `tosm_${key}`,
                name: "Default",
                surname: `TOSM ${key}`,
                password: bcrypt.hashSync('tosm123', 10),
                role: StaffRole.TOSM,
                offices: [office]
            });
            await this.repo.save(defaultTOSM);
            console.log(`Default TOSM user created for office ${office.name} with username '${defaultTOSM.username}' and password 'tosm123'`);
        }
    }

    private async createDefaultEMForOffice(office: OfficeDAO, key: string | undefined) {
        const emsExist = await this.repo.exists({
            where: {
                role: StaffRole.EM,
                offices: {id: office.id, isExternal: true}
            }
        });
        if (!emsExist) {
            const defaultEM = this.repo.create({
                username: `em_${key}`,
                name: "Default",
                surname: `EM ${key}`,
                password: bcrypt.hashSync('em123', 10),
                role: StaffRole.EM,
                offices: [office]
            });
            await this.repo.save(defaultEM);
            console.log(`Default EM user created for office ${office.name} with username '${defaultEM.username}' and password 'em123'`);
        }
    }

    async createDefaultStaffMembersIfNotExists() {
        // Admin
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

        // Municipal Public Relations Officer
        const mproExists = await this.repo.exists({ where: { role: StaffRole.MPRO } });
        if (!mproExists) {
            const offices = await this.officeRepo.find({
                where: { category: OfficeCategory.MOO }
            });

            if (offices.length === 0) {
                throw new BadRequestError(
                    "No Municipal Organization Office found to assign to default MPRO"
                );
            }
            const defaultMPRO = this.repo.create({
                username: "mpro",
                name: "Default",
                surname: "MPRO",
                password: bcrypt.hashSync('mpro123', 10),
                role: StaffRole.MPRO,
                offices: offices
            });
            await this.repo.save(defaultMPRO);
            console.log("Default MPRO user created with username 'mpro' and password 'mpro123'");
        }

        // TOSM and EM for each office
        for (const office of await this.officeRepo.find({ where: { category: Not(OfficeCategory.MOO) }} )) {
            const key = Object.keys(OfficeCategory).find(c => OfficeCategory[c as keyof typeof OfficeCategory] === office.category);
            if (office.isExternal) {
                await this.createDefaultEMForOffice(office, key);
            } else {
                await this.createDefaultTOSMForOffice(office, key);
            }
        }
    }

    // get all staffs
    async getAllStaffs(isExternal?: boolean, category?: OfficeCategory): Promise<StaffDAO[]> {
        if (isExternal !== undefined || category !== undefined) {
            return await this.repo.find(
                {
                    where: {
                        ...(isExternal === undefined ? {} : {role: StaffRole.EM}),
                        ...(category === undefined ? {} : {offices: {category}})
                    },
                    relations: ["offices"]
                }
            )
        }
        return await this.repo.find({ relations: ["offices"] });
    }

    // get all tosm
    async getAllTOSM(category?: OfficeCategory): Promise<StaffDAO[]> {
        return await this.repo.find({
            where: {
                role: StaffRole.TOSM,
                ...(category ? { offices: { category } } : {})
            },
            relations: ["offices"]
        });
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
            const found = new Set(offices.map(o => o.name));
            const missing = officeNames.filter(n => !found.has(n));
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
    async updateStaffOffices(staffUsername: string, officeNames: string[]): Promise<StaffDAO> {
        const staff = await this.getStaffByUsername(staffUsername);
        if (!staff) throw new BadRequestError("Staff not found");

        if (!Array.isArray(officeNames)) {
            throw new BadRequestError("officeNames must be an array");
        }

        const offices = await this.officeRepo.find({
            where: { name: In(officeNames) }
        });

        if (offices.length !== officeNames.length) {
            const foundNames = new Set(offices.map(o => o.name));
            const missing = officeNames.filter(n => !foundNames.has(n));
            throw new BadRequestError(`Offices not found: ${missing.join(", ")}`);
        }

        staff.offices = offices;
        return await this.repo.save(staff);
    }

    // add staff offices
    async addOfficeToStaff(staffUsername: string, officeName: string): Promise<StaffDAO> {
        const staff = await this.getStaffByUsername(staffUsername);
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
    async removeOfficeFromStaff(staffUsername: string, officeName: string): Promise<StaffDAO> {
        const staff = await this.getStaffByUsername(staffUsername);
        if (!staff) throw new BadRequestError("Staff not found");

        const office = await this.officeRepo.findOne({ where: { name: officeName } });
        if (!office) throw new BadRequestError("Office not found");

        staff.offices = staff.offices.filter(o => o.id !== office.id);
        return await this.repo.save(staff);
    }
}