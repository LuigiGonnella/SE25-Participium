import {Between, Repository} from "typeorm";
import {AppDataSource} from "@database";
import {ReportDAO, Status} from "@dao/reportDAO";
import {CitizenDAO} from "@dao/citizenDAO";
import {OfficeCategory} from "@dao/officeDAO";
import { findOrThrowNotFound } from "@utils";
import { StaffDAO, StaffRole } from "@dao/staffDAO";
import { NotFoundError } from "@models/errors/NotFoundError";
import { BadRequestError } from "@models/errors/BadRequestError";

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
    private staffRepo: Repository<StaffDAO>;

    constructor() {
        this.repo = AppDataSource.getRepository(ReportDAO);
        this.staffRepo = AppDataSource.getRepository(StaffDAO);
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
        const qb = this.repo.createQueryBuilder('report')
            .leftJoinAndSelect('report.citizen', 'citizen')
            .leftJoinAndSelect('report.assignedStaff', 'staff');

        if (filters?.citizen_username) {
            qb.andWhere('citizen.username = :citizenUsername', { citizenUsername: filters.citizen_username });
        }

        if (filters?.status) {
            qb.andWhere('report.status = :status', { status: filters.status });
        }

        if (filters?.title) {
            qb.andWhere('report.title = :title', { title: filters.title });
        }

        if (filters?.category) {
            qb.andWhere('report.category = :category', { category: filters.category });
        }

        if (filters?.staff_username) {
            qb.andWhere('staff.username = :staffUsername', { staffUsername: filters.staff_username });
        }

        if (filters?.fromDate && filters?.toDate) {
            const endDate = new Date(filters.toDate);
            endDate.setDate(endDate.getDate() + 1);
            qb.andWhere('report.timestamp BETWEEN :fromDate AND :toDate', { 
                fromDate: filters.fromDate, 
                toDate: endDate 
            });
        }

        qb.orderBy('report.timestamp', 'ASC');

        const reports = await qb.getMany();
        return reports;
    }

    async getReportById(reportId: number): Promise<ReportDAO> {
        const report = await this.repo.findOne({
            where: { id: reportId },
            relations: ['citizen', 'assignedStaff']
        });

        if (!report) {
            throw new NotFoundError(`Report with id '${reportId}' not found`);
        }
        return report;
    }

    async updateReportAsMPRO(reportId: number,
                        updatedStatus: Status,
                        comment?: string,
                        updatedCategory?: OfficeCategory): Promise<ReportDAO> {
        

        const updatedReport = await this.repo.findOne({ 
            where: { id: reportId },
            relations: ['citizen', 'assignedStaff']
        });

        if(!updatedReport)
            throw new NotFoundError(`Report with id '${reportId}' not found`);

        if(updatedReport.status !== Status.PENDING)
            throw new BadRequestError("Cannot update a report that is not pending.");

        await this.repo.update(
            {id: reportId},
            {
                status: updatedStatus,
                ...(comment !== undefined && { comment }),
                ...(updatedCategory && { category: updatedCategory })
            }
        );

        return await this.repo.findOneOrFail({ 
            where: { id: reportId },
            relations: ['citizen', 'assignedStaff']
        });
    }

    async updateReportAsTOSM(reportId: number,
                        updatedStatus: Status,
                        comment?: string,
                        staffUsername?: string): Promise<ReportDAO> {
        

        const updatedReport = await this.repo.findOne({ 
            where: { id: reportId },
            relations: ['citizen', 'assignedStaff']
        });

        if(!updatedReport)
            throw new NotFoundError(`Report with id '${reportId}' not found`);

        if(updatedReport.status === Status.PENDING)
            throw new BadRequestError("Cannot update a report that is not assigned.");

        if(updatedReport.status === Status.REJECTED)
            throw new BadRequestError("Cannot update a rejected report.");

        if(updatedReport.status === Status.RESOLVED)
            throw new BadRequestError("Cannot update a resolved report.");

        if(updatedReport.status === Status.SUSPENDED && updatedStatus !== Status.RESOLVED)
            throw new BadRequestError("Cannot resolve a suspended report.");

        let assignedStaff: StaffDAO | undefined = undefined;

        if (staffUsername) {
            const staff = await this.staffRepo.findOne({
                where: { username: staffUsername },
                relations: ['office']
            });

            if (!staff) {
                throw new NotFoundError(`Staff with username '${staffUsername}' not found`);
            }

            //check if staff's office category matches report category
            if(staff.office.category !== updatedReport.category)
                    throw new BadRequestError(
                        `Staff '${staffUsername}' works in office with category '${staff.office.category}' ` +
                        `but report category is '${updatedReport.category}'`
                );

            assignedStaff = staff;
        }
        
        await this.repo.update(
            {id: reportId},
            {
                status: updatedStatus,
                ...(comment !== undefined && { comment }),
                ...(assignedStaff && { assignedStaff })
            }
        );

        return await this.repo.findOneOrFail({ 
            where: { id: reportId },
            relations: ['citizen', 'assignedStaff']
        });
    }
}
