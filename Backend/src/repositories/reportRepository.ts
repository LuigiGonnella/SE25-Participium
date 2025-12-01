import {And, Between, Not, Repository} from "typeorm";
import {AppDataSource} from "@database";
import {ReportDAO, Status} from "@dao/reportDAO";
import {CitizenDAO} from "@dao/citizenDAO";
import {OfficeCategory} from "@dao/officeDAO";
import { findOrThrowNotFound } from "@utils";
import { StaffDAO, StaffRole } from "@dao/staffDAO";
import { NotFoundError } from "@models/errors/NotFoundError";
import { BadRequestError } from "@models/errors/BadRequestError";
import { NotificationRepository } from "./notificationRepository";
import {MessageDAO} from "@dao/messageDAO";

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
    private notificationRepo: NotificationRepository;

    constructor() {
        this.repo = AppDataSource.getRepository(ReportDAO);
        this.staffRepo = AppDataSource.getRepository(StaffDAO);
        this.notificationRepo = new NotificationRepository();
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

    // Get approved reports for map view
    async getMapReports(): Promise<ReportDAO[]> {

        const reports = await this.repo.find({
            where: { status: And(Not(Status.PENDING), Not(Status.REJECTED)) },
            relations: ['citizen', 'assignedStaff'],
            order: { timestamp: 'ASC' },
        });

        return reports;
    }

    async getReportById(reportId: number): Promise<ReportDAO> {
        const report = await this.repo.findOne({
            where: { id: reportId },
            relations: ['citizen', 'assignedStaff', 'messages', 'messages.staff']
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

        if(!updatedCategory && updatedReport.category === OfficeCategory.MOO)
            throw new BadRequestError("Report cannot be assigned to Municipal Organization Office (MOO).");

        await this.repo.update(
            {id: reportId},
            {
                status: updatedStatus,
                ...(comment !== undefined && { comment }),
                ...(updatedCategory && { category: updatedCategory })
            }
        );

        const result = await this.repo.findOneOrFail({ 
            where: { id: reportId },
            relations: ['citizen', 'assignedStaff']
        });

        // Create notification for citizen if report status changed
        if (result.citizen && updatedStatus !== updatedReport.status) {
            let notificationTitle = "";
            let notificationMessage = "";

            if (updatedStatus === Status.ASSIGNED) {
                notificationTitle = "Report Assigned";
                notificationMessage = `Your report "${result.title}" has been assigned to the appropriate office.`;
            } else if (updatedStatus === Status.REJECTED) {
                notificationTitle = "Report Rejected";
                notificationMessage = `Your report "${result.title}" has been rejected.`;
                if (comment) {
                    notificationMessage += ` Reason: ${comment}`;
                }
            }

            if (notificationTitle) {
                await this.notificationRepo.createNotificationForCitizen(
                    result,
                    notificationTitle,
                    notificationMessage
                );
            }
        }

        return result;
    }

    async updateReportAsTOSM(reportId: number,
                        updatedStatus: Status,
                        comment?: string,
                        staffUsername?: string): Promise<ReportDAO> {
        

        const updatedReport = await this.repo.findOne({ 
            where: { id: reportId },
            relations: ['citizen', 'assignedStaff', 'assignedEM']
        });

        if(!updatedReport)
            throw new NotFoundError(`Report with id '${reportId}' not found`);

        if(updatedReport.status === Status.PENDING)
            throw new BadRequestError("Cannot update a report that is not assigned.");

        if(updatedReport.status === Status.REJECTED)
            throw new BadRequestError("Cannot update a rejected report.");

        if(updatedReport.status === Status.RESOLVED)
            throw new BadRequestError("Cannot update a resolved report.");

        if(updatedReport.status === Status.SUSPENDED && updatedStatus === Status.RESOLVED)
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

            if (staff.role !== StaffRole.TOSM && staff.role !== StaffRole.EM) {
                throw new BadRequestError(`Staff '${staffUsername}' with role '${staff.role}' cannot be assigned to reports.`);
            }

            //check if staff's office category matches report category
            if(staff.office.category !== updatedReport.category)
                    throw new BadRequestError(
                        `Staff '${staffUsername}' works in office with category '${staff.office.category}' ` +
                        `but report category is '${updatedReport.category}'`
                );

            if (staff.role === StaffRole.EM) {
                if (!updatedReport.assignedStaff) {
                    throw new BadRequestError(`Report must be assigned to a TOSM before assigning to an EM.`);
                }
                if (updatedReport.assignedEM) {
                    throw new BadRequestError(`Report is already assigned to EM '${updatedReport.assignedEM.username}'`);
                }
            }

            if (staff.role === StaffRole.TOSM) {
                if (updatedReport.assignedStaff && updatedReport.assignedStaff.username !== staffUsername) {
                    throw new BadRequestError(`Report is already assigned to TOSM '${updatedReport.assignedStaff.username}'`);
                }
            }

            assignedStaff = staff;
        }

        const updateData: any = {
            status: updatedStatus
        };

        if (comment !== undefined) {
            updateData.comment = comment;
        }
        
        if (assignedStaff) {
            if (assignedStaff.role === StaffRole.TOSM) {
                updateData.assignedStaff = assignedStaff;
            } else if (assignedStaff.role === StaffRole.EM) {
                updateData.assignedEM = assignedStaff;
            }
        }

        await this.repo.update({ id: reportId }, updateData);

        const result = await this.repo.findOneOrFail({  
            where: { id: reportId },
            relations: ['citizen', 'assignedStaff', 'assignedEM']
        });

        // Create notification for citizen if report status changed
        if (result.citizen && updatedStatus !== updatedReport.status) {
            let notificationTitle = "";
            let notificationMessage = "";

            if (updatedStatus === Status.IN_PROGRESS) {
                notificationTitle = "Report In Progress";
                notificationMessage = `Your report "${result.title}" has been assigned to ${staffUsername} and is now in progress.`;
            } else if (updatedStatus === Status.SUSPENDED) {
                notificationTitle = "Report Suspended";
                notificationMessage = `Your report "${result.title}" has been suspended.`;
            } else if (updatedStatus === Status.RESOLVED) {
                notificationTitle = "Report Resolved";
                notificationMessage = `Your report "${result.title}" has been marked as resolved.`;
                if (comment) {
                    notificationMessage += ` Comment: ${comment}`;
                }
            }

            if (notificationTitle) {
                await this.notificationRepo.createNotificationForCitizen(
                    result,
                    notificationTitle,
                    notificationMessage
                );
            }
        }

        return result;
    }

    async addMessageToReport(report: ReportDAO, message: string, assignedStaff: StaffDAO | undefined): Promise<ReportDAO> {
        const messageRepo = AppDataSource.getRepository(MessageDAO);
        
        const messageDAO = new MessageDAO();
        messageDAO.message = message;
        messageDAO.staff = assignedStaff;
        messageDAO.report = report;

        // Save message directly to avoid circular reference issues
        await messageRepo.save(messageDAO);

        // Create notification for citizen if message is from staff
        if (assignedStaff && report.citizen) {
            await this.notificationRepo.createNotificationForCitizen(
                report,
                "New message on your report",
                `Staff member has sent a message regarding your report: "${report.title}"`
            );
        }

        // Reload report with messages to return updated data
        return await this.repo.findOne({
            where: { id: report.id },
            relations: ['citizen', 'assignedStaff', 'messages', 'messages.staff']
        }) as ReportDAO;
    }

    async getAllMessages(reportId: number): Promise<MessageDAO[]> {
        const messageRepo = AppDataSource.getRepository(MessageDAO);

        const messages = await messageRepo.find({
            where: { report: { id: reportId } },
            relations: ['staff'],
            order: { timestamp: 'DESC' }
        });
        return messages;
    }
}
