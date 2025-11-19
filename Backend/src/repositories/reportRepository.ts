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

    async getReportById(id: number): Promise<ReportDAO> {
    const report = await this.repo.findOne({
        where: { id },
        relations: ['citizen', 'assignedStaff']
    });

    if (!report) {
        throw new NotFoundError(`Report with id '${id}' not found`);
      }

    return report;
 }


    async updateReport(reportId: number,
                        updatedStatus: Status,
                        comment: string,
                        updatedCategory?: OfficeCategory,
                        assignedStaffUsername?: string): Promise<ReportDAO> {
        

        const updatedReport = await this.repo.findOne({ 
            where: { id: reportId },
            relations: ['citizen', 'assignedStaff']
        });

        if(!updatedReport)
            throw new NotFoundError(`Report with id '${reportId}' not found`);


        let assignedStaff: StaffDAO | undefined = undefined;

        if (assignedStaffUsername) {
            const staff = await this.staffRepo.findOne({
                where: { username: assignedStaffUsername },
                relations: ['office']
            });

            if (!staff) {
                throw new NotFoundError(`Staff with username '${assignedStaffUsername}' not found`);
            }

            // Only TOSM can be assigned to reports
            if(staff.role !== StaffRole.TOSM)
                throw new BadRequestError(`Staff '${assignedStaffUsername}' isn't a ${StaffRole.TOSM}`);

            if(updatedCategory) {
                //if category is provided, check if it matches staff's office category
                if(staff.office.category !== updatedCategory)
                    throw new BadRequestError(
                        `Staff '${assignedStaffUsername}' works in office with category '${staff.office.category}' ` +
                        `but new report category is '${updatedCategory}'`
                );
            } else {
                // If no updated category is provided, use the staff's office category
                updatedCategory = staff.office.category;
            }
            assignedStaff = staff;
        }
        
        
        await this.repo.update(
            {id: reportId},
            {
                status: updatedStatus,
                comment,
                ...(updatedCategory && { category: updatedCategory }),
                ...(assignedStaff && { assignedStaff })
            }
        );

        return await this.repo.findOneOrFail({ 
            where: { id: reportId },
            relations: ['citizen', 'assignedStaff']
        });
    }
}