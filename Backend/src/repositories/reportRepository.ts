import {And, Between, In, Not, Repository} from "typeorm";
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
    private readonly repo: Repository<ReportDAO>;
    private readonly staffRepo: Repository<StaffDAO>;
    private readonly notificationRepo: NotificationRepository;
    private readonly messageRepo: Repository<MessageDAO>;

    constructor() {
        this.repo = AppDataSource.getRepository(ReportDAO);
        this.staffRepo = AppDataSource.getRepository(StaffDAO);
        this.notificationRepo = new NotificationRepository();
        this.messageRepo = AppDataSource.getRepository(MessageDAO);
    }

    async create(params: {
        citizen: CitizenDAO;
        title: string;
        description: string;
        category: OfficeCategory;
        latitude: number;
        longitude: number;
        anonymous: boolean;
        photo1: string;
        photo2?: string;
        photo3?: string;
    }): Promise<ReportDAO> {
        const { citizen, title, description, category, latitude, longitude, anonymous, photo1, photo2, photo3 } = params;
        
        return this.repo.save({
            citizen,
            title,
            description,
            category,
            latitude,
            longitude,
            anonymous,
            photo1,
            photo2,
            photo3
        });
    }

    async getReports(staffUser: StaffDAO, filters?: ReportFilters): Promise<ReportDAO[]> {
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
        if ([StaffRole.TOSM, StaffRole.EM].includes(staffUser.role)) {
            const staffCategories = staffUser.offices.map(o => o.category);
            if (where.category && !staffCategories.includes(where.category))
                return [];
            else if (!where.category)
                where.category = In(staffCategories);
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

        return await this.repo.find({
            where: {status: And(Not(Status.PENDING), Not(Status.REJECTED))},
            relations: ['citizen', 'assignedStaff', 'assignedEM'],
            order: {timestamp: 'ASC'},
        });
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

        const previousStatus = updatedReport.status;
        
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
        if (result.citizen && updatedStatus !== previousStatus)
            await this.notifyCitizen(result, updatedStatus, undefined, comment);

        return result;
    }

    async selfAssignReport(reportId: number, staffUsername: string): Promise<ReportDAO> {
        const staff = findOrThrowNotFound(
            await this.staffRepo.find({where: {username: staffUsername}, relations: ['offices']}),
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

        if (!staff.offices.map(o => o.category).includes(reportToAssign.category))
            throw new BadRequestError(`Staff '${staff.username}' cannot be assigned to reports of category '${reportToAssign.category}'`);

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

    async assignEMToReport(reportId: number, emStaffUsername: string, staffUsername: string,): Promise<ReportDAO> {
        let emStaff;
        if (emStaffUsername !== ""){
            emStaff = findOrThrowNotFound(
                await this.staffRepo.find({where: {username: emStaffUsername, role: StaffRole.EM}, relations: ['offices']}),
                () => true,
                `External maintainer with username '${emStaffUsername}' not found`
            );
        }
        

        const reportToUpdate = findOrThrowNotFound(
            await this.repo.find({where: {id: reportId}, relations: ['citizen', 'assignedStaff', 'assignedEM']}),
            () => true,
            `Report with id '${reportId}' not found`
        );

        if(reportToUpdate.assignedStaff?.username !== staffUsername)
            throw new BadRequestError(`This report is not assigned to you.`);

        if(reportToUpdate.status !== Status.ASSIGNED)
            throw new BadRequestError("Only reports with ASSIGNED status can be assigned to an EM.");

        if(reportToUpdate.assignedEM)
            throw new BadRequestError(`Report is already assigned to EM '${reportToUpdate.assignedEM.username}'`);

        let updateData: any = { isExternal: true }
        if (emStaff){
            if (!emStaff.offices.map(o => o.category).includes(reportToUpdate.category))
                throw new BadRequestError(`External maintainer '${emStaff.username}' cannot be assigned to reports of category '${reportToUpdate.category}'`);
            updateData.assignedEM = emStaff;
        }

        await this.repo.update(
            {id: reportId},
            updateData,
        );

        return findOrThrowNotFound(
            await this.repo.find({where: {id: reportId}, relations: ['citizen', 'assignedStaff', 'assignedEM']}),
            () => true,
            `Report with id '${reportId}' not found after assignment`
        );
    }

    async updateReportAsTOSM(reportId: number, updatedStatus: Status, staffUsername: string, comment?: string,): Promise<ReportDAO> {

        const reportToUpdate = await this.validateReport(reportId, updatedStatus);

        if (reportToUpdate.assignedEM)
            throw new BadRequestError(`Report is assigned to EM '${reportToUpdate.assignedEM.username}'`);
        if(reportToUpdate.assignedStaff?.username !== staffUsername)
            throw new BadRequestError(`This report is not assigned to you.`);

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
        if (result.citizen && updatedStatus !== reportToUpdate.status)
            await this.notifyCitizen(result, updatedStatus, staffUsername, comment);

        return result;
    }

    async updateReportAsEM(reportId: number, updatedStatus: Status, staffUsername: string, comment?: string,): Promise<ReportDAO> {

        const reportToUpdate = await this.validateReport(reportId, updatedStatus);

        if(!reportToUpdate.assignedStaff)
            throw new BadRequestError(`Report is not assigned to a TOSM yet.`);
        if(reportToUpdate.assignedEM?.username !== staffUsername)
            throw new BadRequestError(`This report is not assigned to you.`);

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
        if (result.citizen && updatedStatus !== reportToUpdate.status)
            await this.notifyCitizen(result, updatedStatus, staffUsername, comment);

        return result;
    }

    private async validateReport(reportId: number, updatedStatus: Status): Promise<ReportDAO> {
        const report = await this.repo.findOne({
            where: { id: reportId },
            relations: ['citizen', 'assignedStaff', 'assignedEM']
        });

        if(!report)
            throw new NotFoundError(`Report with id '${reportId}' not found`);

        if([Status.PENDING, Status.REJECTED, Status.RESOLVED].includes(report.status))
            throw new BadRequestError(`Cannot update a ${report.status} report.`);

        if(report.status === Status.SUSPENDED && updatedStatus === Status.RESOLVED)
            throw new BadRequestError("Cannot resolve a suspended report.");
        return report;
    }

    private async notifyCitizen(report: ReportDAO, updatedStatus: Status, staffUsername?: string, comment?: string){
        let notificationTitle = "";
        let notificationMessage = "";

        if (updatedStatus === Status.ASSIGNED) {
            notificationTitle = "Report Assigned";
            notificationMessage = `Your report "${report.title}" has been assigned to the appropriate office.`;
        } else if (updatedStatus === Status.REJECTED) {
            notificationTitle = "Report Rejected";
            notificationMessage = `Your report "${report.title}" has been rejected.`;
            if (comment) {
                notificationMessage += ` Reason: ${comment}`;
            }
        } else if (updatedStatus === Status.IN_PROGRESS) {
            notificationTitle = "Report In Progress";
            notificationMessage = `Your report "${report.title}" has been assigned to ${staffUsername} and is now in progress.`;
        } else if (updatedStatus === Status.SUSPENDED) {
            notificationTitle = "Report Suspended";
            notificationMessage = `Your report "${report.title}" has been suspended.`;
        } else if (updatedStatus === Status.RESOLVED) {
            notificationTitle = "Report Resolved";
            notificationMessage = `Your report "${report.title}" has been marked as resolved.`;
            if (comment) {
                notificationMessage += ` Comment: ${comment}`;
            }
        }
        if (notificationTitle) {
            await this.notificationRepo.createNotificationForCitizen(
                report,
                notificationTitle,
                notificationMessage
            );
        }
    }

    async addMessageToReport(report: ReportDAO, message: string, assignedStaff?: StaffDAO, isPrivate: boolean = false): Promise<ReportDAO> {      
        const messageDAO = new MessageDAO();
        messageDAO.message = message;
        messageDAO.staff = assignedStaff;
        messageDAO.report = report;
        messageDAO.isPrivate = isPrivate;

        // Save message directly to avoid circular reference issues
        await this.messageRepo.save(messageDAO);

        // Create notification for citizen if message is from staff
        if (assignedStaff && report.citizen && !isPrivate) {
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
        return await this.messageRepo.find({
            where: {report: {id: reportId}},
            relations: ['staff'],
            order: {timestamp: 'DESC'}
        });
    }

    async getAllPublicMessages(reportId: number): Promise<MessageDAO[]> {
        return await this.messageRepo.find({
            where: {report: {id: reportId}, isPrivate: false},
            relations: ['staff'],
            order: {timestamp: 'DESC'}
        });
    }
}
