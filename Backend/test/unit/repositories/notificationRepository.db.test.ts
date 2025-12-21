import { initializeTestDataSource, closeTestDataSource, TestDataSource } from "../../setup/test-datasource";
import { NotificationRepository } from "@repositories/notificationRepository";
import { CitizenRepository } from "@repositories/citizenRepository";
import { StaffRepository } from "@repositories/staffRepository";
import { OfficeRepository } from "@repositories/officeRepository";
import { ReportRepository } from "@repositories/reportRepository";
import { NotificationDAO } from "@dao/notificationDAO";
import { ReportDAO } from "@dao/reportDAO";
import { OfficeCategory } from "@dao/officeDAO";
import { NotFoundError } from "@errors/NotFoundError";
import { beforeAllE2e, DEFAULT_CITIZENS, DEFAULT_STAFF, TestDataManager } from "../../e2e/lifecycle";

let notificationRepo: NotificationRepository;
let citizenRepo: CitizenRepository;
let staffRepo: StaffRepository;
let officeRepo: OfficeRepository;
let reportRepo: ReportRepository;

beforeAll(async () => {
    await initializeTestDataSource();
    await beforeAllE2e();
    notificationRepo = new NotificationRepository();
    citizenRepo = new CitizenRepository();
    staffRepo = new StaffRepository();
    officeRepo = new OfficeRepository();
    reportRepo = new ReportRepository();
});

afterAll(async () => {
    await closeTestDataSource();
});

beforeEach(async () => {
    await TestDataSource.getRepository(NotificationDAO).clear();
    await TestDataSource.getRepository(ReportDAO).clear();
});

describe("NotificationRepository", () => {
    let report: ReportDAO;

    beforeEach(async () => {
        const citizen = await TestDataManager.getCitizen('citizen1');
        report = await reportRepo.create({
            citizen,
            title: "Test Report",
            description: "Description",
            category: OfficeCategory.RSTLO,
            latitude: 45,
            longitude: 7,
            anonymous: false,
            photo1: "photo.jpg"
        });
    });

    describe("createNotificationForCitizen", () => {
        it("should create a notification for a default citizen successfully", async () => {
            const title = "Report Update";
            const message = "Your report has been updated.";
            const notification = await notificationRepo.createNotificationForCitizen(report, title, message);

            expect(notification).toBeDefined();
            expect(notification.title).toBe(title);
            expect(notification.message).toBe(message);
            expect(notification.citizen.username).toBe(DEFAULT_CITIZENS.citizen1.username);
            expect(notification.report.id).toBe(report.id);
            expect(notification.isRead).toBe(false);
        });

        it("should throw NotFoundError if the citizen in the report does not exist", async () => {
            const invalidReport = { ...report, citizen: { username: "nonexistent" } } as any;
            await expect(
                notificationRepo.createNotificationForCitizen(invalidReport, "Title", "Message")
            ).rejects.toThrow(NotFoundError);
        });
    });

    describe("createNotificationForStaff", () => {
        it("should create a notification for a default staff member successfully", async () => {
            const title = "New Assignment";
            const message = "You have a new report assigned.";
            const notification = await notificationRepo.createNotificationForStaff(
                DEFAULT_STAFF.tosm_RSTLO.username,
                title,
                message
            );

            expect(notification).toBeDefined();
            expect(notification.title).toBe(title);
            expect(notification.message).toBe(message);
            expect(notification.staff?.username).toBe(DEFAULT_STAFF.tosm_RSTLO.username);
            expect(notification.isRead).toBe(false);
        });

        it("should throw NotFoundError if the staff member does not exist", async () => {
            await expect(
                notificationRepo.createNotificationForStaff("nonexistent", "Title", "Message")
            ).rejects.toThrow(NotFoundError);
        });
    });

    describe("getNotificationsForCitizen", () => {
        it("should return all notifications for a specific default citizen", async () => {
            await notificationRepo.createNotificationForCitizen(report, "Title 1", "Message 1");
            await notificationRepo.createNotificationForCitizen(report, "Title 2", "Message 2");

            const notifications = await notificationRepo.getNotificationsForCitizen(DEFAULT_CITIZENS.citizen1.username);
            expect(notifications).toHaveLength(2);
            expect(notifications[1].title).toBe("Title 2");
        });

        it("should return an empty array if a citizen has no notifications", async () => {
            const notifications = await notificationRepo.getNotificationsForCitizen(DEFAULT_CITIZENS.citizen2.username);
            expect(notifications).toEqual([]);
        });
    });

    describe("getNotificationsForStaff", () => {
        it("should return all notifications for a specific default staff member", async () => {
            await notificationRepo.createNotificationForStaff(DEFAULT_STAFF.tosm_RSTLO.username, "Title 1", "Message 1");
            await notificationRepo.createNotificationForStaff(DEFAULT_STAFF.tosm_RSTLO.username, "Title 2", "Message 2");

            const notifications = await notificationRepo.getNotificationsForStaff(DEFAULT_STAFF.tosm_RSTLO.username);
            expect(notifications).toHaveLength(2);
            expect(notifications[1].title).toBe("Title 2");
        });

        it("should return an empty array if a staff member has no notifications", async () => {
            const notifications = await notificationRepo.getNotificationsForStaff(DEFAULT_STAFF.mpro.username);
            expect(notifications).toEqual([]);
        });
    });

    describe("markAsRead", () => {
        it("should mark a notification as read", async () => {
            const notification = await notificationRepo.createNotificationForCitizen(report, "Title", "Message");
            expect(notification.isRead).toBe(false);

            await notificationRepo.markAsRead(notification.id);

            const updatedNotification = await TestDataSource.getRepository(NotificationDAO).findOneBy({ id: notification.id });
            expect(updatedNotification?.isRead).toBe(true);
        });
    });
});