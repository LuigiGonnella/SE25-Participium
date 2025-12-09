import { ReportRepository } from "@repositories/reportRepository";
import { CitizenRepository } from "@repositories/citizenRepository";
import { StaffRepository } from "@repositories/staffRepository";
import { OfficeRepository } from "@repositories/officeRepository";
import { ReportDAO, Status } from "@dao/reportDAO";
import { CitizenDAO } from "@dao/citizenDAO";
import { StaffDAO } from "@dao/staffDAO";
import { OfficeDAO, OfficeCategory } from "@dao/officeDAO";
import { StaffRole } from "@dao/staffDAO";
import { NotFoundError } from "@errors/NotFoundError";
import { BadRequestError } from "@errors/BadRequestError";
import { initializeTestDataSource, closeTestDataSource, TestDataSource } from "../../setup/test-datasource";
import { NotificationRepository } from "@repositories/notificationRepository";
import { NotificationDAO } from "@models/dao/notificationDAO";
import { MessageDAO } from "@models/dao/messageDAO";

let citizenRepo: CitizenRepository;
let reportRepo: ReportRepository;
let staffRepo: StaffRepository;
let officeRepo: OfficeRepository;
let notificationRepo: NotificationRepository;

const fakeCitizen = {
    email: "test@example.com",
    username: "testuser",
    name: "John",
    surname: "Doe",
    password: "12345678",
    receive_emails: false,
    profilePicture: "",
    telegram_username: ""
};

const fakeOffice = {
    id: 1,
    name: "Road Signs and Traffic Lights Office",
    description: "Handles issues related to road signs and traffic lights.",
    category: OfficeCategory.RSTLO,
    isExternal: false,
    members: []
};

const fakeStaff = {
    id: 1,
    username: "staffuser",
    name: "Jane",
    surname: "Smith",
    password: "password123",
    role: StaffRole.TOSM,
    offices: [fakeOffice],
    assignedReports: [],
};

beforeAll(async () => {
    await initializeTestDataSource();
    citizenRepo = new CitizenRepository();
    reportRepo = new ReportRepository();
    staffRepo = new StaffRepository();
    officeRepo = new OfficeRepository();
    notificationRepo = new NotificationRepository();
});

afterAll(async () => {
    await closeTestDataSource();
});

beforeEach(async () => {
    await TestDataSource.getRepository(NotificationDAO).clear();
    await TestDataSource.getRepository(MessageDAO).clear();
    await TestDataSource.getRepository(ReportDAO).clear();
    await TestDataSource.getRepository(StaffDAO).clear();
    await TestDataSource.getRepository(CitizenDAO).clear();
    await TestDataSource.getRepository(OfficeDAO).clear();
});

describe("ReportRepository - test suite", () => {

    it("creates a new report successfully", async () => {
        const citizen = await citizenRepo.createCitizen(
            fakeCitizen.email,
            fakeCitizen.username,
            fakeCitizen.name,
            fakeCitizen.surname,
            fakeCitizen.password,
            fakeCitizen.receive_emails,
            fakeCitizen.profilePicture,
            fakeCitizen.telegram_username
        );

        await reportRepo.create(
            citizen,
            "Broken light",
            "Streetlight not working",
            OfficeCategory.RSTLO,
            45.07,
            7.68,
            false,
            "/uploads/reports/1.jpg"
        );

        const saved = await TestDataSource
            .getRepository(ReportDAO)
            .findOne({ where: { title: "Broken light" }, relations: ["citizen"] });

        expect(saved).toBeTruthy();
        expect(saved?.title).toBe("Broken light");
        expect(saved?.citizen.username).toBe(fakeCitizen.username);
    });

    it("stores photo2 and photo3 when provided", async () => {
        const citizen = await citizenRepo.createCitizen(
            fakeCitizen.email,
            fakeCitizen.username,
            fakeCitizen.name,
            fakeCitizen.surname,
            fakeCitizen.password,
            fakeCitizen.receive_emails,
            fakeCitizen.profilePicture,
            fakeCitizen.telegram_username
        );

        await reportRepo.create(
            citizen,
            "Garbage issue",
            "Overflowing trash bin",
            OfficeCategory.WO,
            45.1,
            7.6,
            true,
            "/img1.jpg",
            "/img2.jpg",
            "/img3.jpg"
        );

        const saved = await TestDataSource
            .getRepository(ReportDAO)
            .findOneBy({ title: "Garbage issue" });

        expect(saved?.photo1).toBe("/img1.jpg");
        expect(saved?.photo2).toBe("/img2.jpg");
        expect(saved?.photo3).toBe("/img3.jpg");
    });

    it("sets photo2 and photo3 to null when not provided", async () => {
        const citizen = await citizenRepo.createCitizen(
            fakeCitizen.email,
            fakeCitizen.username,
            fakeCitizen.name,
            fakeCitizen.surname,
            fakeCitizen.password,
            fakeCitizen.receive_emails,
            fakeCitizen.profilePicture,
            fakeCitizen.telegram_username
        );

        await reportRepo.create(
            citizen,
            "Tree fallen",
            "Tree blocking the road",
            OfficeCategory.RUFO,
            45.0,
            7.7,
            false,
            "/img-main.jpg"
        );

        const saved = await TestDataSource
            .getRepository(ReportDAO)
            .findOneBy({ title: "Tree fallen" });

        expect(saved?.photo2).toBeNull();
        expect(saved?.photo3).toBeNull();
    });

    it("stores all numeric and boolean fields correctly", async () => {
        const citizen = await citizenRepo.createCitizen(
            fakeCitizen.email,
            fakeCitizen.username,
            fakeCitizen.name,
            fakeCitizen.surname,
            fakeCitizen.password,
            fakeCitizen.receive_emails,
            fakeCitizen.profilePicture,
            fakeCitizen.telegram_username
        );

        await reportRepo.create(
            citizen,
            "Street flooding",
            "Water everywhere",
            OfficeCategory.WSO,
            44.998,
            7.654,
            true,
            "/photo.jpg"
        );

        const saved = await TestDataSource
            .getRepository(ReportDAO)
            .findOneBy({ title: "Street flooding" });

        expect(saved?.latitude).toBe(44.998);
        expect(saved?.longitude).toBe(7.654);
        expect(saved?.anonymous).toBe(true);
    });

});

describe("ReportRepository - getReports", () => {

    it("returns all reports when no filters applied", async () => {
        const citizen = await citizenRepo.createCitizen(
            fakeCitizen.email,
            fakeCitizen.username,
            fakeCitizen.name,
            fakeCitizen.surname,
            fakeCitizen.password,
            fakeCitizen.receive_emails,
            fakeCitizen.profilePicture,
            fakeCitizen.telegram_username
        );
        // Simulate email verification
        const c = await TestDataSource.getRepository(CitizenDAO).findOneBy({ username: citizen.username });
        c!.email = fakeCitizen.email;
        await TestDataSource.getRepository(CitizenDAO).save(c!);
        const verifiedCitizen = await TestDataSource.getRepository(CitizenDAO).findOneBy({ username: citizen.username });

        await reportRepo.create(verifiedCitizen!, "Report 1", "Desc 1", OfficeCategory.RSTLO, 45, 7, false, "/1.jpg");
        await reportRepo.create(verifiedCitizen!, "Report 2", "Desc 2", OfficeCategory.RSTLO, 45, 7, false, "/2.jpg");

        const reports = await reportRepo.getReports(fakeStaff);
        expect(reports).toHaveLength(2);
    });

    it("filters reports by citizen username", async () => {
        const citizen1 = await citizenRepo.createCitizen("c1@test.com", "citizen1", "C1", "One", "pass", false, "", "");
        const citizen2 = await citizenRepo.createCitizen("c2@test.com", "citizen2", "C2", "Two", "pass", false, "", "");
        // Simulate email verification
        const c1 = await TestDataSource.getRepository(CitizenDAO).findOneBy({ username: "citizen1" });
        c1!.email = "c1@test.com";
        await TestDataSource.getRepository(CitizenDAO).save(c1!);
        const c2 = await TestDataSource.getRepository(CitizenDAO).findOneBy({ username: "citizen2" });
        c2!.email = "c2@test.com";
        await TestDataSource.getRepository(CitizenDAO).save(c2!);

        await reportRepo.create(c1!, "Report C1", "Desc", OfficeCategory.RSTLO, 45, 7, false, "/1.jpg");
        await reportRepo.create(c2!, "Report C2", "Desc", OfficeCategory.RSTLO, 45, 7, false, "/2.jpg");

        const reports = await reportRepo.getReports(fakeStaff, { citizen_username: "citizen1" });
        expect(reports).toHaveLength(1);
        expect(reports[0].title).toBe("Report C1");
    });

    it("filters reports by status", async () => {
        const citizen = await citizenRepo.createCitizen(
            fakeCitizen.email,
            fakeCitizen.username,
            fakeCitizen.name,
            fakeCitizen.surname,
            fakeCitizen.password,
            fakeCitizen.receive_emails,
            fakeCitizen.profilePicture,
            fakeCitizen.telegram_username
        );
        // Simulate email verification
        const c = await TestDataSource.getRepository(CitizenDAO).findOneBy({ username: citizen.username });
        c!.email = fakeCitizen.email;
        await TestDataSource.getRepository(CitizenDAO).save(c!);

        const report = await reportRepo.create(c!, "Report", "Desc", OfficeCategory.RSTLO, 45, 7, false, "/1.jpg");
        await TestDataSource.getRepository(ReportDAO).update({ id: report.id }, { status: Status.ASSIGNED });

        const reports = await reportRepo.getReports(fakeStaff,{ status: Status.ASSIGNED });
        expect(reports).toHaveLength(1);
        expect(reports[0].status).toBe(Status.ASSIGNED);
    });

    it("filters reports by category", async () => {
        const citizen = await citizenRepo.createCitizen(
            fakeCitizen.email,
            fakeCitizen.username,
            fakeCitizen.name,
            fakeCitizen.surname,
            fakeCitizen.password,
            fakeCitizen.receive_emails,
            fakeCitizen.profilePicture,
            fakeCitizen.telegram_username
        );
        // Simulate email verification
        const c = await TestDataSource.getRepository(CitizenDAO).findOneBy({ username: citizen.username });
        c!.email = fakeCitizen.email;
        await TestDataSource.getRepository(CitizenDAO).save(c!);

        await reportRepo.create(c!, "Road Sign", "Desc", OfficeCategory.RSTLO, 45, 7, false, "/1.jpg");

        const reports = await reportRepo.getReports(fakeStaff, { category: OfficeCategory.RSTLO });
        expect(reports).toHaveLength(1);
        expect(reports[0].category).toBe(OfficeCategory.RSTLO);
    });

    it("filters reports by title", async () => {
        const citizen = await citizenRepo.createCitizen(
            fakeCitizen.email,
            fakeCitizen.username,
            fakeCitizen.name,
            fakeCitizen.surname,
            fakeCitizen.password,
            fakeCitizen.receive_emails,
            fakeCitizen.profilePicture,
            fakeCitizen.telegram_username
        );
        // Simulate email verification
        const c = await TestDataSource.getRepository(CitizenDAO).findOneBy({ username: citizen.username });
        c!.email = fakeCitizen.email;
        await TestDataSource.getRepository(CitizenDAO).save(c!);

        await reportRepo.create(c!, "Specific Title", "Desc", OfficeCategory.RSTLO, 45, 7, false, "/1.jpg");
        await reportRepo.create(c!, "Other", "Desc", OfficeCategory.RSTLO, 45, 7, false, "/2.jpg");

        const reports = await reportRepo.getReports(fakeStaff, { title: "Specific Title" });
        expect(reports).toHaveLength(1);
        expect(reports[0].title).toBe("Specific Title");
    });

});

describe("ReportRepository - getReportById", () => {

    it("returns report by id with relations", async () => {
        const citizen = await citizenRepo.createCitizen(
            fakeCitizen.email,
            fakeCitizen.username,
            fakeCitizen.name,
            fakeCitizen.surname,
            fakeCitizen.password,
            fakeCitizen.receive_emails,
            fakeCitizen.profilePicture,
            fakeCitizen.telegram_username
        );

        const created = await reportRepo.create(citizen, "Report", "Desc", OfficeCategory.WSO, 45, 7, false, "/1.jpg");

        const found = await reportRepo.getReportById(created.id);
        expect(found).toBeTruthy();
        expect(found.id).toBe(created.id);
        expect(found.citizen).toBeTruthy();
    });

    it("throws NotFoundError when report does not exist", async () => {
        await expect(reportRepo.getReportById(9999)).rejects.toThrow(NotFoundError);
    });

});

describe("ReportRepository - updateReportAsMPRO", () => {

    it("updates status from PENDING to ASSIGNED", async () => {
        const citizen = await citizenRepo.createCitizen(
            fakeCitizen.email,
            fakeCitizen.username,
            fakeCitizen.name,
            fakeCitizen.surname,
            fakeCitizen.password,
            fakeCitizen.receive_emails,
            fakeCitizen.profilePicture,
            fakeCitizen.telegram_username
        );

        const report = await reportRepo.create(citizen, "Report", "Desc", OfficeCategory.WSO, 45, 7, false, "/1.jpg");

        const updated = await reportRepo.updateReportAsMPRO(report.id, Status.ASSIGNED);
        expect(updated.status).toBe(Status.ASSIGNED);
    });

    it("updates status from PENDING to REJECTED with comment", async () => {
        const citizen = await citizenRepo.createCitizen(
            fakeCitizen.email,
            fakeCitizen.username,
            fakeCitizen.name,
            fakeCitizen.surname,
            fakeCitizen.password,
            fakeCitizen.receive_emails,
            fakeCitizen.profilePicture,
            fakeCitizen.telegram_username
        );

        const report = await reportRepo.create(citizen, "Report", "Desc", OfficeCategory.WSO, 45, 7, false, "/1.jpg");

        const updated = await reportRepo.updateReportAsMPRO(report.id, Status.REJECTED, "Invalid report");
        expect(updated.status).toBe(Status.REJECTED);
        expect(updated.comment).toBe("Invalid report");
    });

    it("updates category when provided", async () => {
        const citizen = await citizenRepo.createCitizen(
            fakeCitizen.email,
            fakeCitizen.username,
            fakeCitizen.name,
            fakeCitizen.surname,
            fakeCitizen.password,
            fakeCitizen.receive_emails,
            fakeCitizen.profilePicture,
            fakeCitizen.telegram_username
        );

        const report = await reportRepo.create(citizen, "Report", "Desc", OfficeCategory.WSO, 45, 7, false, "/1.jpg");

        const updated = await reportRepo.updateReportAsMPRO(report.id, Status.ASSIGNED, undefined, OfficeCategory.WO);
        expect(updated.category).toBe(OfficeCategory.WO);
    });

    it("throws NotFoundError when report does not exist", async () => {
        await expect(reportRepo.updateReportAsMPRO(9999, Status.ASSIGNED)).rejects.toThrow(NotFoundError);
    });

    it("throws BadRequestError when report is not PENDING", async () => {
        const citizen = await citizenRepo.createCitizen(
            fakeCitizen.email,
            fakeCitizen.username,
            fakeCitizen.name,
            fakeCitizen.surname,
            fakeCitizen.password,
            fakeCitizen.receive_emails,
            fakeCitizen.profilePicture,
            fakeCitizen.telegram_username
        );

        const report = await reportRepo.create(citizen, "Report", "Desc", OfficeCategory.WSO, 45, 7, false, "/1.jpg");
        await TestDataSource.getRepository(ReportDAO).update({ id: report.id }, { status: Status.ASSIGNED });

        await expect(reportRepo.updateReportAsMPRO(report.id, Status.REJECTED)).rejects.toThrow(BadRequestError);
    });

});

describe("ReportRepository - updateReportAsTOSM", () => {

    it("updates status to IN_PROGRESS and assigns staff", async () => {
        const citizen = await citizenRepo.createCitizen(
            fakeCitizen.email,
            fakeCitizen.username,
            fakeCitizen.name,
            fakeCitizen.surname,
            fakeCitizen.password,
            fakeCitizen.receive_emails,
            fakeCitizen.profilePicture,
            fakeCitizen.telegram_username
        );
        // Simulate email verification
        const c = await TestDataSource.getRepository(CitizenDAO).findOneBy({ username: citizen.username });
        c!.email = fakeCitizen.email;
        await TestDataSource.getRepository(CitizenDAO).save(c!);

        const office = await officeRepo.createOffice(
            fakeStaff.offices[0].name,
            "Office description",
            OfficeCategory.RSTLO
        );

        const staff = await staffRepo.createStaff(
            fakeStaff.username,
            fakeStaff.name,
            fakeStaff.surname,
            fakeStaff.password,
            fakeStaff.role,
            [fakeStaff.offices[0].name]
        );

        const report = await reportRepo.create(c!, "Report", "Desc", OfficeCategory.RSTLO, 45, 7, false, "/1.jpg");
        await TestDataSource.getRepository(ReportDAO).update({ id: report.id }, { status: Status.ASSIGNED, assignedStaff: staff });

        const updated = await reportRepo.updateReportAsTOSM(report.id, Status.IN_PROGRESS, staff.username);
        expect(updated.status).toBe(Status.IN_PROGRESS);
        expect(updated.assignedStaff).toBeTruthy();
    });

    it("updates status to RESOLVED with comment", async () => {
        const citizen = await citizenRepo.createCitizen(
            fakeCitizen.email,
            fakeCitizen.username,
            fakeCitizen.name,
            fakeCitizen.surname,
            fakeCitizen.password,
            fakeCitizen.receive_emails,
            fakeCitizen.profilePicture,
            fakeCitizen.telegram_username
        );

        const report = await reportRepo.create(citizen, "Report", "Desc", OfficeCategory.WSO, 45, 7, false, "/1.jpg");
        await TestDataSource.getRepository(ReportDAO).update({ id: report.id }, { status: Status.IN_PROGRESS });

        const updated = await reportRepo.updateReportAsTOSM(report.id, Status.RESOLVED, "Fixed the issue");
        expect(updated.status).toBe(Status.RESOLVED);
        expect(updated.comment).toBe("Fixed the issue");
    });

    it("updates status to SUSPENDED", async () => {
        const citizen = await citizenRepo.createCitizen(
            fakeCitizen.email,
            fakeCitizen.username,
            fakeCitizen.name,
            fakeCitizen.surname,
            fakeCitizen.password,
            fakeCitizen.receive_emails,
            fakeCitizen.profilePicture,
            fakeCitizen.telegram_username
        );

        const report = await reportRepo.create(citizen, "Report", "Desc", OfficeCategory.WSO, 45, 7, false, "/1.jpg");
        await TestDataSource.getRepository(ReportDAO).update({ id: report.id }, { status: Status.IN_PROGRESS });

        const updated = await reportRepo.updateReportAsTOSM(report.id, Status.SUSPENDED, "staffuser");
        expect(updated.status).toBe(Status.SUSPENDED);
    });

    it("throws NotFoundError when report does not exist", async () => {
        await expect(reportRepo.updateReportAsTOSM(9999, Status.IN_PROGRESS, fakeStaff.username)).rejects.toThrow(NotFoundError);
    });

    it("throws BadRequestError when report is PENDING", async () => {
        const citizen = await citizenRepo.createCitizen(
            fakeCitizen.email,
            fakeCitizen.username,
            fakeCitizen.name,
            fakeCitizen.surname,
            fakeCitizen.password,
            fakeCitizen.receive_emails,
            fakeCitizen.profilePicture,
            fakeCitizen.telegram_username
        );

        const report = await reportRepo.create(citizen, "Report", "Desc", OfficeCategory.WSO, 45, 7, false, "/1.jpg");

        await expect(reportRepo.updateReportAsTOSM(report.id, Status.IN_PROGRESS, fakeStaff.username)).rejects.toThrow(BadRequestError);
    });

    it("throws BadRequestError when report is REJECTED", async () => {
        const citizen = await citizenRepo.createCitizen(
            fakeCitizen.email,
            fakeCitizen.username,
            fakeCitizen.name,
            fakeCitizen.surname,
            fakeCitizen.password,
            fakeCitizen.receive_emails,
            fakeCitizen.profilePicture,
            fakeCitizen.telegram_username
        );

        const report = await reportRepo.create(citizen, "Report", "Desc", OfficeCategory.WSO, 45, 7, false, "/1.jpg");
        await TestDataSource.getRepository(ReportDAO).update({ id: report.id }, { status: Status.REJECTED });

        await expect(reportRepo.updateReportAsTOSM(report.id, Status.IN_PROGRESS, fakeStaff.username)).rejects.toThrow(BadRequestError);
    });

    it("throws BadRequestError when report is RESOLVED", async () => {
        const citizen = await citizenRepo.createCitizen(
            fakeCitizen.email,
            fakeCitizen.username,
            fakeCitizen.name,
            fakeCitizen.surname,
            fakeCitizen.password,
            fakeCitizen.receive_emails,
            fakeCitizen.profilePicture,
            fakeCitizen.telegram_username
        );

        const report = await reportRepo.create(citizen, "Report", "Desc", OfficeCategory.WSO, 45, 7, false, "/1.jpg");
        await TestDataSource.getRepository(ReportDAO).update({ id: report.id }, { status: Status.RESOLVED });

        await expect(reportRepo.updateReportAsTOSM(report.id, Status.IN_PROGRESS, fakeStaff.username)).rejects.toThrow(BadRequestError);
    });

    it("throws NotFoundError when staff does not exist", async () => {
        const citizen = await citizenRepo.createCitizen(
            fakeCitizen.email,
            fakeCitizen.username,
            fakeCitizen.name,
            fakeCitizen.surname,
            fakeCitizen.password,
            fakeCitizen.receive_emails,
            fakeCitizen.profilePicture,
            fakeCitizen.telegram_username
        );

        const report = await reportRepo.create(citizen, "Report", "Desc", OfficeCategory.WSO, 45, 7, false, "/1.jpg");
        await TestDataSource.getRepository(ReportDAO).update({ id: report.id }, { status: Status.ASSIGNED });

        await expect(reportRepo.updateReportAsTOSM(report.id, Status.IN_PROGRESS, "nonexistent")).rejects.toThrow(NotFoundError);
    });

    it("throws BadRequestError when staff office category does not match report category", async () => {
        const citizen = await citizenRepo.createCitizen(
            fakeCitizen.email,
            fakeCitizen.username,
            fakeCitizen.name,
            fakeCitizen.surname,
            fakeCitizen.password,
            fakeCitizen.receive_emails,
            fakeCitizen.profilePicture,
            fakeCitizen.telegram_username
        );

        const office = await officeRepo.createOffice(
            fakeStaff.offices[0].name,
            "Office description",
            OfficeCategory.RSTLO
        );

        const staff = await staffRepo.createStaff(
            fakeStaff.username,
            fakeStaff.name,
            fakeStaff.surname,
            fakeStaff.password,
            fakeStaff.role,
            [fakeStaff.offices[0].name]
        );

        const report = await reportRepo.create(citizen, "Report", "Desc", OfficeCategory.WSO, 45, 7, false, "/1.jpg");
        await TestDataSource.getRepository(ReportDAO).update({ id: report.id }, { status: Status.ASSIGNED });

        await expect(reportRepo.updateReportAsTOSM(report.id, Status.IN_PROGRESS, staff.username)).rejects.toThrow(BadRequestError);
    });

});

describe("ReportRepository - Messages", () => {
    let citizen: CitizenDAO;
    let staff: StaffDAO;
    let report: ReportDAO;

    beforeEach(async () => {
        await officeRepo.createOffice(
            fakeStaff.offices[0].name,
            "Office for testing",
            OfficeCategory.RSTLO
        );
        citizen = await citizenRepo.createCitizen(
            fakeCitizen.email,
            fakeCitizen.username,
            fakeCitizen.name,
            fakeCitizen.surname,
            fakeCitizen.password,
            fakeCitizen.receive_emails,
            fakeCitizen.profilePicture,
            fakeCitizen.telegram_username
        );
        staff = await staffRepo.createStaff(
            fakeStaff.username,
            fakeStaff.name,
            fakeStaff.surname,
            fakeStaff.password,
            fakeStaff.role,
            [fakeStaff.offices[0].name]
        );
        report = await reportRepo.create(
            citizen,
            "Message Test Report",
            "A report for testing messages.",
            OfficeCategory.RSTLO,
            45, 7, false, "/photo.jpg"
        );
    });

    describe("addMessageToReport", () => {
        it("should add a message from a citizen (staff is undefined)", async () => {
            const messageText = "This is a citizen's message.";
            const updatedReport = await reportRepo.addMessageToReport(report, messageText, undefined);

            expect(updatedReport.messages).toHaveLength(1);
            expect(updatedReport.messages[0].message).toBe(messageText);
            expect(updatedReport.messages[0].staff).toBeNull();
        });

        it("should add a message from staff and create a notification for the citizen", async () => {
            const messageText = "This is a staff's reply.";
            const updatedReport = await reportRepo.addMessageToReport(report, messageText, staff);

            // Check if the message was added correctly
            expect(updatedReport.messages).toHaveLength(1);
            const savedMessage = updatedReport.messages[0];
            expect(savedMessage.message).toBe(messageText);
            expect(savedMessage.staff?.username).toBe(staff.username);

            // Check if a notification was created for the citizen
            const notifications = await notificationRepo.getNotificationsForCitizen(citizen.username);
            expect(notifications).toHaveLength(1);
            expect(notifications[0].title).toBe("New message on your report");
            expect(notifications[0].message).toContain(report.title);
        });
    });

    describe("getAllMessages", () => {
        it("should return all messages for a report, ordered by timestamp ascending", async () => {
            await reportRepo.addMessageToReport(report, "First message", undefined);
            await reportRepo.addMessageToReport(report, "Second message", staff);

            const messages = await reportRepo.getAllMessages(report.id);

            expect(messages).toHaveLength(2);
            expect(messages[1].message).toBe("Second message");
            expect(messages[0].message).toBe("First message");
        });

        it("should return an empty array for a report with no messages", async () => {
            const messages = await reportRepo.getAllMessages(report.id);
            expect(messages).toEqual([]);
        });
    });
});
