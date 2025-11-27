import { initializeTestDataSource, closeTestDataSource, TestDataSource } from "../../setup/test-datasource";
import { NotificationRepository } from "@repositories/notificationRepository";
import { CitizenRepository } from "@repositories/citizenRepository";
import { StaffRepository } from "@repositories/staffRepository";
import { OfficeRepository } from "@repositories/officeRepository";
import { ReportRepository } from "@repositories/reportRepository";
import { NotificationDAO } from "@dao/notificationDAO";
import { ReportDAO } from "@dao/reportDAO";
import { CitizenDAO } from "@dao/citizenDAO";
import { StaffDAO, StaffRole } from "@dao/staffDAO";
import { OfficeDAO, OfficeCategory } from "@dao/officeDAO";
import { NotFoundError } from "@errors/NotFoundError";

let notificationRepo: NotificationRepository;
let citizenRepo: CitizenRepository;
let staffRepo: StaffRepository;
let officeRepo: OfficeRepository;
let reportRepo: ReportRepository;

const fakeCitizen = {
    email: "citizen@test.com",
    username: "testcitizen",
    name: "Test",
    surname: "Citizen",
    password: "password123",
    receive_emails: true,
    profilePicture: "",
    telegram_username: ""
};

const fakeStaff = {
    username: "teststaff",
    name: "Test",
    surname: "Staff",
    password: "password123",
    role: StaffRole.TOSM,
    officeName: "Test Office"
};

const fakeOffice = {
    name: "Test Office",
    description: "An office for testing",
    category: OfficeCategory.RSTLO
};

beforeAll(async () => {
    await initializeTestDataSource();
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
    // Clear tables in the correct order to respect foreign key constraints
    await TestDataSource.getRepository(NotificationDAO).clear();
    await TestDataSource.getRepository(ReportDAO).clear();
    await TestDataSource.getRepository(StaffDAO).clear();
    await TestDataSource.getRepository(CitizenDAO).clear();
    await TestDataSource.getRepository(OfficeDAO).clear();
});

describe("NotificationRepository", () => {
    let citizen: CitizenDAO;
    let staff: StaffDAO;
    let report: ReportDAO;

    beforeEach(async () => {
        await officeRepo.createOffice(fakeOffice.name, fakeOffice.description, fakeOffice.category);
        citizen = await citizenRepo.createCitizen(fakeCitizen.email, fakeCitizen.username, fakeCitizen.name, fakeCitizen.surname, fakeCitizen.password, fakeCitizen.receive_emails, fakeCitizen.profilePicture, fakeCitizen.telegram_username);
        staff = await staffRepo.createStaff(fakeStaff.username, fakeStaff.name, fakeStaff.surname, fakeStaff.password, fakeStaff.role, fakeStaff.officeName);
        report = await reportRepo.create(citizen, "Test Report", "Description", OfficeCategory.RSTLO, 45, 7, false, "photo.jpg");
    });

    describe("createNotificationForCitizen", () => {
        it("should create a notification for a citizen successfully", async () => {
            const title = "Report Update";
            const message = "Your report has been updated.";
            const notification = await notificationRepo.createNotificationForCitizen(report, title, message);

            expect(notification).toBeDefined();
            expect(notification.title).toBe(title);
            expect(notification.message).toBe(message);
            expect(notification.citizen.id).toBe(citizen.id);
            expect(notification.report.id).toBe(report.id);
            expect(notification.isRead).toBe(false);
        });

        it("should throw NotFoundError if the citizen in the report does not exist", async () => {
            const invalidReport = { ...report, citizen: { ...citizen, username: "nonexistent" } };
            await expect(
                notificationRepo.createNotificationForCitizen(invalidReport, "Title", "Message")
            ).rejects.toThrow(NotFoundError);
        });
    });

    describe("createNotificationForStaff", () => {
        it("should create a notification for a staff member successfully", async () => {
            const title = "New Assignment";
            const message = "You have a new report assigned.";
            const notification = await notificationRepo.createNotificationForStaff(staff.username, title, message);

            expect(notification).toBeDefined();
            expect(notification.title).toBe(title);
            expect(notification.message).toBe(message);
            expect(notification.staff?.username).toBe(staff.username);
            expect(notification.isRead).toBe(false);
        });

        it("should throw NotFoundError if the staff member does not exist", async () => {
            await expect(
                notificationRepo.createNotificationForStaff("nonexistent", "Title", "Message")
            ).rejects.toThrow(NotFoundError);
        });
    });

    describe("getNotificationsForCitizen", () => {
        it("should return all notifications for a specific citizen", async () => {
            await notificationRepo.createNotificationForCitizen(report, "Title 1", "Message 1");
            await notificationRepo.createNotificationForCitizen(report, "Title 2", "Message 2");

            const notifications = await notificationRepo.getNotificationsForCitizen(citizen.username);
            expect(notifications).toHaveLength(2);
            expect(notifications[1].title).toBe("Title 2");
        });

        it("should return an empty array if a citizen has no notifications", async () => {
            const notifications = await notificationRepo.getNotificationsForCitizen(citizen.username);
            expect(notifications).toEqual([]);
        });
    });

    describe("getNotificationsForStaff", () => {
        it("should return all notifications for a specific staff member", async () => {
            await notificationRepo.createNotificationForStaff(staff.username, "Title 1", "Message 1");
            await notificationRepo.createNotificationForStaff(staff.username, "Title 2", "Message 2");

            const notifications = await notificationRepo.getNotificationsForStaff(staff.username);
            expect(notifications).toHaveLength(2);
            expect(notifications[1].title).toBe("Title 2");
        });

        it("should return an empty array if a staff member has no notifications", async () => {
            const notifications = await notificationRepo.getNotificationsForStaff(staff.username);
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

