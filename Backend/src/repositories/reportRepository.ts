import {And, Between, Not, Repository} from "typeorm";
import {AppDataSource} from "@database";
import {ReportDAO, Status} from "@dao/reportDAO";
import {CitizenDAO} from "@dao/citizenDAO";
import {OfficeCategory} from "@dao/officeDAO";
import {StaffDAO, StaffRole} from "@dao/staffDAO";
import {NotFoundError} from "@models/errors/NotFoundError";
import {BadRequestError} from "@models/errors/BadRequestError";
import {NotificationRepository} from "./notificationRepository";
import {MessageDAO} from "@dao/messageDAO";
import {findOrThrowNotFound} from "@utils";

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
            const endDate = filters.toDate;
            endDate.setDate(endDate.getDate() + 1);
            where.timestamp = Between(filters.fromDate, endDate);
        }

        return await this.repo.find({
            where,
            relations: ['citizen', 'assignedStaff', 'assignedEM'],
            order: {timestamp: 'ASC'},
        });
    }

    // Get approved reports for map view
    async getMapReports(): Promise<ReportDAO[]> {

        const reports = await this.repo.find({
            where: { status: And(Not(Status.PENDING), Not(Status.REJECTED)) },
            relations: ['citizen', 'assignedStaff', 'assignedEM'],
            order: { timestamp: 'ASC' },
        });

        return reports;
    }

    async getReportById(reportId: number): Promise<ReportDAO> {
        const report = await this.repo.findOne({
            where: { id: reportId },
            relations: ['citizen', 'assignedStaff', 'assignedEM', 'messages', 'messages.staff']
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

    async selfAssignReport(reportId: number, staffUsername: string): Promise<ReportDAO> {
        const staff = findOrThrowNotFound(
            await this.staffRepo.find({where: {username: staffUsername}}),
            () => true,
            `Staff with username '${staffUsername}' not found`
        );

        const reportToAssign = findOrThrowNotFound(
            await this.repo.find({where: {id: reportId}, relations: ['citizen', 'assignedStaff', 'assignedEM']}),
            () => true,
            `Report with id '${reportId}' not found`
        );

        if (reportToAssign.status !== Status.ASSIGNED)
            throw new BadRequestError("Only reports with ASSIGNED status can be self-assigned.");

        if (reportToAssign.assignedStaff)
            throw new BadRequestError(`Report is already assigned to staff '${reportToAssign.assignedStaff.username}'`);

        await this.repo.update(
            {id: reportId},
            { assignedStaff: staff }
        );

        return findOrThrowNotFound(
            await this.repo.find({where: {id: reportId}, relations: ['citizen', 'assignedStaff', 'assignedEM']}),
            () => true,
            `Report with id '${reportId}' not found after assignment`
        );
    }

    async updateReportAsTOSM(reportId: number, updatedStatus: Status, staffUsername: string, comment?: string,): Promise<ReportDAO> {

        const reportToUpdate = await this.repo.findOne({
            where: { id: reportId },
            relations: ['citizen', 'assignedStaff', 'assignedEM']
        });

        if(!reportToUpdate)
            throw new NotFoundError(`Report with id '${reportId}' not found`);

        if (reportToUpdate.assignedEM !== undefined)
            throw new BadRequestError(`Report is assigned to EM '${reportToUpdate.assignedEM.username}'`);
        else if(reportToUpdate.assignedStaff?.username !== staffUsername && staffUsername !== undefined)
            throw new BadRequestError(`Report is assigned to TOSM '${reportToUpdate.assignedStaff?.username}'`);

        if([Status.PENDING, Status.REJECTED, Status.RESOLVED].includes(reportToUpdate.status))
            throw new BadRequestError(`Cannot update a ${reportToUpdate.status} report.`);

        if(reportToUpdate.status === Status.SUSPENDED && updatedStatus === Status.RESOLVED)
            throw new BadRequestError("Cannot resolve a suspended report.");

        const updateData: any = {
            status: updatedStatus
        };

        if (comment !== undefined) {
            updateData.comment = comment;
        }

        await this.repo.update({ id: reportId }, updateData);

        const result = findOrThrowNotFound(
            await this.repo.find({where: { id: reportId }, relations: ['citizen', 'assignedStaff', 'assignedEM']}),
            () => true,
            `Report with id '${reportId}' not found after status update`
        );

        // Create notification for citizen if report status changed
        if (result.citizen && updatedStatus !== reportToUpdate.status) {
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

    async assignEMToReport(reportId: number, emStaffUsername: string, staffUsername: string,): Promise<ReportDAO> {
        const emStaff = findOrThrowNotFound(
            await this.staffRepo.find({where: {username: emStaffUsername, role: StaffRole.EM}}),
            () => true,
            `External maintainer with username '${emStaffUsername}' not found`
        );

        const reportToUpdate = findOrThrowNotFound(
            await this.repo.find({where: {id: reportId}, relations: ['citizen', 'assignedStaff', 'assignedEM']}),
            () => true,
            `Report with id '${reportId}' not found`
        );

        if(reportToUpdate.assignedStaff?.username !== staffUsername)
            throw new BadRequestError(`Report is assigned to TOSM '${reportToUpdate.assignedStaff?.username}'`);

        if(reportToUpdate.status !== Status.ASSIGNED)
            throw new BadRequestError("Only reports with ASSIGNED status can be assigned to an EM.");

        if(reportToUpdate.assignedEM)
            throw new BadRequestError(`Report is already assigned to EM '${reportToUpdate.assignedEM.username}'`);

        await this.repo.update(
            {id: reportId},
            { assignedEM: emStaff }
        );

        return findOrThrowNotFound(
            await this.repo.find({where: {id: reportId}, relations: ['citizen', 'assignedStaff', 'assignedEM']}),
            () => true,
            `Report with id '${reportId}' not found after assignment`
        );
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
