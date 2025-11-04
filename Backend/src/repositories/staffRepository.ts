import { AppDataSource } from "@database";
import { StaffDAO } from "@models/dao/staffDAO";
import { Repository } from "typeorm";

export class StaffRepository {
    private repo: Repository<StaffDAO>;

    constructor() {
        this.repo = AppDataSource.getRepository(StaffDAO);
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
}