import {Between, LessThan, MoreThanOrEqual, Repository} from "typeorm";
import {AppDataSource} from "@database";
import {ReportDAO, Status} from "@dao/reportDAO";
import {CitizenDAO} from "@dao/citizenDAO";
import {OfficeCategory} from "@dao/officeDAO";

export interface ReportFilters {
    citizen_username?: string;
    fromDate?: Date;
    toDate?: Date;
    status?: Status;
    title?: string;
    category?: OfficeCategory;
    staff_username?: string;
}

export class ReportRepository {
    private repo: Repository<ReportDAO>;

    constructor() {
        this.repo = AppDataSource.getRepository(ReportDAO);
    }

    async create(
        citizen: CitizenDAO,
        title: string,
        description: string,
        category: OfficeCategory,
        latitude: number,
        longitude: number,
        anonymous: boolean,
        photo1: string,
        photo2?: string,
        photo3?: string
    ): Promise<ReportDAO> {
        return this.repo.save({
            citizen: citizen,
            title: title,
            description: description,
            category: category,
            latitude: latitude,
            longitude: longitude,
            anonymous: anonymous,
            photo1: photo1,
            photo2: photo2,
            photo3: photo3
        });
    }

    async getReports(filters?: ReportFilters): Promise<ReportDAO[]> {
        const where: any = {};

        if (filters?.citizen_username) {
            where.citizen = { username: filters.citizen_username };
        }

        if (filters?.status){
            where.status = filters.status;
        }

        if (filters?.title) {
            where.title = filters.title;
        }

        if (filters?.category) {
            where.category = filters.category;
        }

        if (filters?.staff_username) {
            where.assignedStaff = { username: filters.staff_username };
        }

        if (filters?.fromDate && filters?.toDate) {
            const endDate = new Date(filters.toDate);
            endDate.setDate(endDate.getDate() + 1);
            where.timestamp = Between(filters.fromDate, endDate);
        }

        const reports = await this.repo.find({
            where,
            relations: ['citizen', 'assignedStaff'],
            order: { timestamp: 'ASC' },
        });

        return reports;
    }
}