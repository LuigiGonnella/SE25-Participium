import { AppDataSource } from "@database";
import { NotificationDAO } from "@dao/notificationDAO";
import { CitizenDAO } from "@dao/citizenDAO";
import { StaffDAO } from "@dao/staffDAO";
import { NotFoundError } from "@errors/NotFoundError";
import {ReportDAO} from "@dao/reportDAO";

export class NotificationRepository {
    private repo = AppDataSource.getRepository(NotificationDAO);
    private citizenRepo = AppDataSource.getRepository(CitizenDAO);
    private staffRepo = AppDataSource.getRepository(StaffDAO);

    async createNotificationForCitizen(
        report: ReportDAO,
        title: string,
        message: string
    ): Promise<NotificationDAO> {
        const citizen = await this.citizenRepo.findOne({
            where: { username: report.citizen.username }
        });

        if (!citizen) {
            throw new NotFoundError(`Citizen with username '${report.citizen.username}' not found`);
        }

        const notification = this.repo.create({
            title,
            message,
            report,
            citizen,
            isRead: false
        });

        return await this.repo.save(notification);
    }

    async createNotificationForStaff(
        staffUsername: string,
        title: string,
        message: string
    ): Promise<NotificationDAO> {
        const staff = await this.staffRepo.findOne({
            where: { username: staffUsername }
        });

        if (!staff) {
            throw new NotFoundError(`Staff with username '${staffUsername}' not found`);
        }

        const notification = this.repo.create({
            title,
            message,
            staff,
            isRead: false
        });

        return await this.repo.save(notification);
    }

    async getNotificationsForCitizen(citizenUsername: string): Promise<NotificationDAO[]> {
        return await this.repo.find({
            where: { citizen: { username: citizenUsername } },
            relations: ["report"],
            order: { timestamp: "DESC" }
        });
    }

    async getNotificationsForStaff(staffUsername: string): Promise<NotificationDAO[]> {
        return await this.repo.find({
            where: { staff: { username: staffUsername } },
            order: { timestamp: "DESC" }
        });
    }

    async markAsRead(notificationId: number): Promise<void> {
        await this.repo.update({ id: notificationId }, { isRead: true });
    }
}
