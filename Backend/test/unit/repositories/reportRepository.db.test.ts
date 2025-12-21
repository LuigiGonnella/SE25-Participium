import { ReportRepository } from "@repositories/reportRepository";
import { CitizenRepository } from "@repositories/citizenRepository";
import { StaffRepository } from "@repositories/staffRepository";
import { OfficeRepository } from "@repositories/officeRepository";
import { ReportDAO, Status } from "@dao/reportDAO";
import { CitizenDAO } from "@dao/citizenDAO";
import { StaffDAO } from "@dao/staffDAO";
import { OfficeCategory } from "@dao/officeDAO";
import { NotFoundError } from "@errors/NotFoundError";
import { BadRequestError } from "@errors/BadRequestError";
import { initializeTestDataSource, closeTestDataSource, TestDataSource } from "../../setup/test-datasource";
import { NotificationRepository } from "@repositories/notificationRepository";
import { NotificationDAO } from "@models/dao/notificationDAO";
import { MessageDAO } from "@models/dao/messageDAO";
import { beforeAllE2e, DEFAULT_CITIZENS, TestDataManager } from "../../e2e/lifecycle";

let citizenRepo: CitizenRepository;
let reportRepo: ReportRepository;
let staffRepo: StaffRepository;
let officeRepo: OfficeRepository;
let notificationRepo: NotificationRepository;

beforeAll(async () => {
    await initializeTestDataSource();
    await beforeAllE2e();
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
});

describe("ReportRepository - test suite", () => {

    it("creates a new report successfully with default citizen", async () => {
        const citizen = await TestDataManager.getCitizen('citizen1');

        await reportRepo.create({
            citizen,
            title: "Broken light",
            description: "Streetlight not working",
            category: OfficeCategory.RSTLO,
            latitude: 45.07,
            longitude: 7.68,
            anonymous: false,
            photo1: "/uploads/reports/1.jpg"
        });

        const saved = await TestDataSource
            .getRepository(ReportDAO)
            .findOne({ where: { title: "Broken light" }, relations: ["citizen"] });

        expect(saved).toBeTruthy();
        expect(saved?.title).toBe("Broken light");
        expect(saved?.citizen.username).toBe(DEFAULT_CITIZENS.citizen1.username);
    });

    it("stores photo2 and photo3 when provided", async () => {
        const citizen = await TestDataManager.getCitizen('citizen2');

        await reportRepo.create({
            citizen,
            title: "Garbage issue",
            description: "Overflowing trash bin",
            category: OfficeCategory.WO,
            latitude: 45.1,
            longitude: 7.6,
            anonymous: true,
            photo1: "/img1.jpg",
            photo2: "/img2.jpg",
            photo3: "/img3.jpg"
        });

        const saved = await TestDataSource
            .getRepository(ReportDAO)
            .findOneBy({ title: "Garbage issue" });

        expect(saved?.photo1).toBe("/img1.jpg");
        expect(saved?.photo2).toBe("/img2.jpg");
        expect(saved?.photo3).toBe("/img3.jpg");
    });

    it("sets photo2 and photo3 to null when not provided", async () => {
        const citizen = await TestDataManager.getCitizen('citizen3');

        await reportRepo.create({
            citizen,
            title: "Single photo report",
            description: "Testing single photo",
            category: OfficeCategory.PLO,
            latitude: 45,
            longitude: 7.5,
            anonymous: false,
            photo1: "/single.jpg"
        });

        const saved = await TestDataSource
            .getRepository(ReportDAO)
            .findOneBy({ title: "Single photo report" });

        expect(saved?.photo1).toBe("/single.jpg");
        expect(saved?.photo2).toBeNull();
        expect(saved?.photo3).toBeNull();
    });

    it("gets all reports", async () => {
        const citizen = await TestDataManager.getCitizen('citizen1');
        const staff = await TestDataManager.getStaff('mpro');

        await reportRepo.create({
            citizen,
            title: "Report 1",
            description: "First report",
            category: OfficeCategory.RSTLO,
            latitude: 45,
            longitude: 7,
            anonymous: false,
            photo1: "/r1.jpg"
        });

        await reportRepo.create({
            citizen,
            title: "Report 2",
            description: "Second report",
            category: OfficeCategory.WSO,
            latitude: 45.1,
            longitude: 7.1,
            anonymous: false,
            photo1: "/r2.jpg"
        });

        const reports = await reportRepo.getReports(staff);
        expect(reports.length).toBe(2);
    });

    it("gets report by id", async () => {
        const citizen = await TestDataManager.getCitizen('citizen1');

        const created = await reportRepo.create({
            citizen,
            title: "Find by ID",
            description: "Description",
            category: OfficeCategory.RSTLO,
            latitude: 45,
            longitude: 7,
            anonymous: false,
            photo1: "/img.jpg"
        });

        const found = await reportRepo.getReportById(created.id);
        expect(found).toBeDefined();
        expect(found?.title).toBe("Find by ID");
    });

    it("returns null for non-existent report id", async () => {
        await expect(reportRepo.getReportById(99999)).rejects.toThrow('Report with id \'99999\' not found');
    });

    it("gets reports by citizen username", async () => {
        const citizen = await TestDataManager.getCitizen('citizen2');
        const staff = await TestDataManager.getStaff('mpro');

        await reportRepo.create({
            citizen,
            title: "Citizen Report 1",
            description: "First",
            category: OfficeCategory.RSTLO,
            latitude: 45,
            longitude: 7,
            anonymous: false,
            photo1: "/c1.jpg"
        });

        await reportRepo.create({
            citizen,
            title: "Citizen Report 2",
            description: "Second",
            category: OfficeCategory.WSO,
            latitude: 45.1,
            longitude: 7.1,
            anonymous: false,
            photo1: "/c2.jpg"
        });

        const reports = await reportRepo.getReports(staff, { citizen_username: DEFAULT_CITIZENS.citizen2.username });
        expect(reports.length).toBe(2);
    });

    it("filters reports by status", async () => {
        const citizen = await TestDataManager.getCitizen('citizen1');
        const staff = await TestDataManager.getStaff('mpro');

        await reportRepo.create({
            citizen,
            title: "Pending Report",
            description: "Description",
            category: OfficeCategory.RSTLO,
            latitude: 45,
            longitude: 7,
            anonymous: false,
            photo1: "/img.jpg"
        });

        const report2 = await reportRepo.create({
            citizen,
            title: "Assigned Report",
            description: "Description",
            category: OfficeCategory.RSTLO,
            latitude: 45,
            longitude: 7,
            anonymous: false,
            photo1: "/img.jpg"
        });

        // Update report2 status to ASSIGNED
        await TestDataSource.getRepository(ReportDAO).update(
            { id: report2.id },
            { status: Status.ASSIGNED }
        );

        const filters = { status: Status.ASSIGNED };
        const filtered = await reportRepo.getReports(staff, filters);
        
        expect(filtered.length).toBe(1);
        expect(filtered[0].title).toBe("Assigned Report");
    });

    it("filters reports by category", async () => {
        const citizen = await TestDataManager.getCitizen('citizen1');
        const staff = await TestDataManager.getStaff('mpro');

        await reportRepo.create({
            citizen,
            title: "RSTLO Report",
            description: "Description",
            category: OfficeCategory.RSTLO,
            latitude: 45,
            longitude: 7,
            anonymous: false,
            photo1: "/img.jpg"
        });

        await reportRepo.create({
            citizen,
            title: "WSO Report",
            description: "Description",
            category: OfficeCategory.WSO,
            latitude: 45,
            longitude: 7,
            anonymous: false,
            photo1: "/img.jpg"
        });

        const filters = { category: OfficeCategory.WSO };
        const filtered = await reportRepo.getReports(staff, filters);
        
        expect(filtered.length).toBe(1);
        expect(filtered[0].title).toBe("WSO Report");
    });

    it("filters reports by citizen username", async () => {
        const citizen1 = await TestDataManager.getCitizen('citizen1');
        const citizen2 = await TestDataManager.getCitizen('citizen2');
        const staff = await TestDataManager.getStaff('mpro');

        await reportRepo.create({
            citizen: citizen1,
            title: "Citizen1 Report",
            description: "Description",
            category: OfficeCategory.RSTLO,
            latitude: 45,
            longitude: 7,
            anonymous: false,
            photo1: "/img.jpg"
        });

        await reportRepo.create({
            citizen: citizen2,
            title: "Citizen2 Report",
            description: "Description",
            category: OfficeCategory.WSO,
            latitude: 45,
            longitude: 7,
            anonymous: false,
            photo1: "/img.jpg"
        });

        const filters = { citizen_username: DEFAULT_CITIZENS.citizen1.username };
        const filtered = await reportRepo.getReports(staff, filters);
        
        expect(filtered.length).toBe(1);
        expect(filtered[0].citizen.username).toBe(DEFAULT_CITIZENS.citizen1.username);
    });

    it("filters reports by title", async () => {
        const citizen = await TestDataManager.getCitizen('citizen1');
        const staff = await TestDataManager.getStaff('mpro');

        await reportRepo.create({
            citizen,
            title: "Broken Light",
            description: "Description",
            category: OfficeCategory.RSTLO,
            latitude: 45,
            longitude: 7,
            anonymous: false,
            photo1: "/img.jpg"
        });

        await reportRepo.create({
            citizen,
            title: "Water Leak",
            description: "Description",
            category: OfficeCategory.WSO,
            latitude: 45,
            longitude: 7,
            anonymous: false,
            photo1: "/img.jpg"
        });

        const filters = { title: "Broken Light" };
        const filtered = await reportRepo.getReports(staff, filters);
        
        expect(filtered.length).toBe(1);
        expect(filtered[0].title).toBe("Broken Light");
    });

    it("creates anonymous report without citizen reference", async () => {
        const citizen = await TestDataManager.getCitizen('citizen1');

        const report = await reportRepo.create({
            citizen,
            title: "Anonymous Report",
            description: "Description",
            category: OfficeCategory.RSTLO,
            latitude: 45,
            longitude: 7,
            anonymous: true,
            photo1: "/img.jpg"
        });

        expect(report.anonymous).toBe(true);
    });

    it("update a report for the MPRO", async () => {
        const citizen = await TestDataManager.getCitizen('citizen1');

        const report = await reportRepo.create({
            citizen,
            title: "Report to Update",
            description: "Description",
            category: OfficeCategory.RSTLO,
            latitude: 45,
            longitude: 7,
            anonymous: false,
            photo1: "/img.jpg"
        });

        const updatedReport = await reportRepo.updateReportAsMPRO(report.id, Status.ASSIGNED);
        expect(updatedReport.status).toBe(Status.ASSIGNED);
    });

    it("update the category of a report by MPRO", async () => {
        const citizen = await TestDataManager.getCitizen('citizen1');
        const report = await reportRepo.create({
            citizen,
            title: "Report with Wrong Category",
            description: "Description",
            category: OfficeCategory.MOO,
            latitude: 45,
            longitude: 7,
            anonymous: false,
            photo1: "/img.jpg"
        });
        const updatedReport = await reportRepo.updateReportAsMPRO(report.id, Status.ASSIGNED, undefined, OfficeCategory.RSTLO);
        expect(updatedReport.category).toBe(OfficeCategory.RSTLO);
    });

    it("throws NotFoundError when MPRO tries to update non-existent report", async () => {
        await expect(
            reportRepo.updateReportAsMPRO(99999, Status.ASSIGNED)
        ).rejects.toThrow('Report with id \'99999\' not found');
    });

    it("sends notification to citizen when report status is updated by MPRO", async () => {
        const citizen = await TestDataManager.getCitizen('citizen1');
        const report = await reportRepo.create({
            citizen,
            title: "Report for Notification",
            description: "Description",
            category: OfficeCategory.RSTLO,
            latitude: 45,
            longitude: 7,
            anonymous: false,
            photo1: "/img.jpg"
        });
        await reportRepo.updateReportAsMPRO(report.id, Status.ASSIGNED);

        const notifications = await TestDataSource
            .getRepository(NotificationDAO)
            .find({ where: { citizen: { username: citizen.username } } });

        expect(notifications.length).toBe(1);
        expect(notifications[0].title).toBe("Report Assigned");
        expect(notifications[0].message).toContain('Your report "Report for Notification" has been assigned to the appropriate office.');
    });

    it("throw NotFoundError when updating report with invalid id", async () => {
        await expect(
            reportRepo.updateReportAsMPRO(123456, Status.RESOLVED)
        ).rejects.toThrow(NotFoundError);
    });

    it("throw BadRequestError when updating a non-pending report", async () => {
        const citizen = await TestDataManager.getCitizen('citizen1');
        const report = await reportRepo.create({
            citizen,
            title: "Non-pending Report",
            description: "Description",
            category: OfficeCategory.RSTLO,
            latitude: 45,
            longitude: 7,
            anonymous: false,
            photo1: "/img.jpg"
        });
        await reportRepo.updateReportAsMPRO(report.id, Status.ASSIGNED);

        await expect(
            reportRepo.updateReportAsMPRO(report.id, Status.RESOLVED)
        ).rejects.toThrow(BadRequestError);
    });

    it("update report status to REJECTED with comment by MPRO", async () => {
        const citizen = await TestDataManager.getCitizen('citizen1');
        const report = await reportRepo.create({
            citizen,
            title: "Report to Reject",
            description: "Description",
            category: OfficeCategory.RSTLO,
            latitude: 45,
            longitude: 7,
            anonymous: false,
            photo1: "/img.jpg"
        });
        
        const updatedReport = await reportRepo.updateReportAsMPRO(report.id, Status.REJECTED, "Does not meet requirements");
        expect(updatedReport.status).toBe(Status.REJECTED);
        expect(updatedReport.comment).toBe("Does not meet requirements");
    });

    it("send notification to citizen when MPRO rejects report", async () => {
        const citizen = await TestDataManager.getCitizen('citizen1');
        const report = await reportRepo.create({
            citizen,
            title: "Report to Reject with Notification",
            description: "Description",
            category: OfficeCategory.RSTLO,
            latitude: 45,
            longitude: 7,
            anonymous: false,
            photo1: "/img.jpg"
        });
        await reportRepo.updateReportAsMPRO(report.id, Status.REJECTED, "Invalid submission");
        
        const notifications = await TestDataSource
            .getRepository(NotificationDAO)
            .find({ where: { citizen: { username: citizen.username } } });
        
        expect(notifications.length).toBe(1);
        expect(notifications[0].title).toBe("Report Rejected");
        expect(notifications[0].message).toContain('Your report "Report to Reject with Notification" has been rejected.');
        expect(notifications[0].message).toContain("Reason: Invalid submission");
    });

    it("update report status and category by MPRO", async () => {
        const citizen = await TestDataManager.getCitizen('citizen1');
        const report = await reportRepo.create({
            citizen,
            title: "Report with Wrong Category",
            description: "Description",
            category: OfficeCategory.MOO,
            latitude: 45,
            longitude: 7,
            anonymous: false,
            photo1: "/img.jpg"
        });
        
        const updatedReport = await reportRepo.updateReportAsMPRO(report.id, Status.ASSIGNED, undefined, OfficeCategory.RSTLO);
        expect(updatedReport.status).toBe(Status.ASSIGNED);
        expect(updatedReport.category).toBe(OfficeCategory.RSTLO);
    });

    it("throws BadRequestError when MPRO assigns MOO report without changing category", async () => {
        const citizen = await TestDataManager.getCitizen('citizen1');
        const report = await reportRepo.create({
            citizen,
            title: "MOO Report",
            description: "Description",
            category: OfficeCategory.MOO,
            latitude: 45,
            longitude: 7,
            anonymous: false,
            photo1: "/img.jpg"
        });
        
        await expect(
            reportRepo.updateReportAsMPRO(report.id, Status.ASSIGNED)
        ).rejects.toThrow(BadRequestError);
    });

    it("self-assign a report for the TOSM", async () => {
        const tosm = await TestDataManager.getStaff('tosm_RSTLO');
        const citizen = await TestDataManager.getCitizen('citizen1');
        const report = await reportRepo.create({
            citizen,
            title: "Report to Update by TOSM",
            description: "Description",
            category: OfficeCategory.RSTLO,
            latitude: 45,
            longitude: 7,
            anonymous: false,
            photo1: "/img.jpg"
        });
        // First, MPRO assigns the report
        await reportRepo.updateReportAsMPRO(report.id, Status.ASSIGNED);
        const updatedReport = await reportRepo.selfAssignReport(report.id, tosm.username);
        expect(updatedReport.status).toBe(Status.ASSIGNED);
    });

    it("throws NotFoundError when TOSM tries to self-assign non-existent report", async () => {
        const tosm = await TestDataManager.getStaff('tosm_RSTLO');
        await expect(
            reportRepo.selfAssignReport(99999, tosm.username)
        ).rejects.toThrow('Report with id \'99999\' not found');
    });

    it("throws BadRequestError when TOSM tries to self-assign a report of different category", async () => {
        const tosm = await TestDataManager.getStaff('tosm_WSO');
        const citizen = await TestDataManager.getCitizen('citizen1');
        const report = await reportRepo.create({
            citizen,
            title: "Report of different category",
            description: "Description",
            category: OfficeCategory.RSTLO,
            latitude: 45,
            longitude: 7,
            anonymous: false,
            photo1: "/img.jpg"
        });
        // First, MPRO assigns the report
        await reportRepo.updateReportAsMPRO(report.id, Status.ASSIGNED);
        await expect(
            reportRepo.selfAssignReport(report.id, tosm.username)
        ).rejects.toThrow(BadRequestError);
    });

    it("throws BadRequestError when TOSM tries to self-assign a non-assigned report", async () => {
        const tosm = await TestDataManager.getStaff('tosm_RSTLO');
        const citizen = await TestDataManager.getCitizen('citizen1');
        const report = await reportRepo.create({
            citizen,
            title: "Non-assigned Report",
            description: "Description",
            category: OfficeCategory.RSTLO,
            latitude: 45,
            longitude: 7,
            anonymous: false,
            photo1: "/img.jpg"
        });
        await expect( 
            reportRepo.selfAssignReport(report.id, tosm.username)
        ).rejects.toThrow(BadRequestError);
    });

    it("throws BadRequestError when TOSM tries to self-assign an already assigned report", async () => {
        const tosm = await TestDataManager.getStaff('tosm_RSTLO');
        const citizen = await TestDataManager.getCitizen('citizen1');   
        const report = await reportRepo.create({
            citizen,
            title: "Already Assigned Report",
            description: "Description",
            category: OfficeCategory.RSTLO,
            latitude: 45,
            longitude: 7,
            anonymous: false,
            photo1: "/img.jpg"
        });
        // First, MPRO assigns the report
        await reportRepo.updateReportAsMPRO(report.id, Status.ASSIGNED);
        // Then, TOSM self-assigns the report
        await reportRepo.selfAssignReport(report.id, tosm.username);
        await expect(
            reportRepo.selfAssignReport(report.id, tosm.username)
        ).rejects.toThrow(BadRequestError);
    });

    it("update report for TOSM to RESOLVED", async () => {
        const tosm = await TestDataManager.getStaff('tosm_RSTLO');
        const citizen = await TestDataManager.getCitizen('citizen1');
        const report = await reportRepo.create({
            citizen,
            title: "Report to Update Status by TOSM",
            description: "Description",
            category: OfficeCategory.RSTLO,
            latitude: 45,
            longitude: 7,
            anonymous: false,
            photo1: "/img.jpg"
        });
        // First, MPRO assigns the report   
        await reportRepo.updateReportAsMPRO(report.id, Status.ASSIGNED);
        // Then, TOSM self-assigns the report
        await reportRepo.selfAssignReport(report.id, tosm.username);
        const updatedReport = await reportRepo.updateReportAsTOSM(report.id, Status.RESOLVED, tosm.username);
        expect(updatedReport.status).toBe(Status.RESOLVED);
    });

    it("throws NotFoundError when TOSM tries to update non-existent report", async () => {
        const tosm = await TestDataManager.getStaff('tosm_RSTLO');
        await expect(
            reportRepo.updateReportAsTOSM(99999, Status.RESOLVED, tosm.username)
        ).rejects.toThrow('Report with id \'99999\' not found');
    });

    it("throws BadRequestError when TOSM tries to update a report of different category", async () => {     
        const tosm = await TestDataManager.getStaff('tosm_WSO');
        const citizen = await TestDataManager.getCitizen('citizen1');
        const report = await reportRepo.create({
            citizen,
            title: "Report of different category to update",
            description: "Description",
            category: OfficeCategory.RSTLO,
            latitude: 45,
            longitude: 7,
            anonymous: false,
            photo1: "/img.jpg"
        });
        // First, MPRO assigns the report
        await reportRepo.updateReportAsMPRO(report.id, Status.ASSIGNED);
        // Then, TOSM tries to update the report
        await expect(
            reportRepo.updateReportAsTOSM(report.id, Status.RESOLVED, tosm.username)
        ).rejects.toThrow(BadRequestError);
    });

    it("send notification to citizen when TOSM updates report status to RESOLVED", async () => {
        const tosm = await TestDataManager.getStaff('tosm_RSTLO');
        const citizen = await TestDataManager.getCitizen('citizen1');
        const report = await reportRepo.create({
            citizen,
            title: "Report for TOSM Notification",
            description: "Description",
            category: OfficeCategory.RSTLO,
            latitude: 45,
            longitude: 7,
            anonymous: false,
            photo1: "/img.jpg"
        });
        // First, MPRO assigns the report
        await reportRepo.updateReportAsMPRO(report.id, Status.ASSIGNED);
        // Then, TOSM self-assigns the report
        await reportRepo.selfAssignReport(report.id, tosm.username);
        await reportRepo.updateReportAsTOSM(report.id, Status.RESOLVED, tosm.username);
        const notifications = await TestDataSource
            .getRepository(NotificationDAO)
            .find({ where: { citizen: { username: citizen.username } } });
        expect(notifications.length).toBe(2);
        const resolvedNotification = notifications.find(n => n.title === "Report Resolved");
        expect(resolvedNotification).toBeDefined();
        expect(resolvedNotification?.message).toContain('Your report "Report for TOSM Notification" has been marked as resolved.');
    });

    it("update status for TOSM to SUSPENDED", async () => {
        const tosm = await TestDataManager.getStaff('tosm_RSTLO');
        const citizen = await TestDataManager.getCitizen('citizen1');
        const report = await reportRepo.create({
            citizen,
            title: "Report to Suspend by TOSM",
            description: "Description",
            category: OfficeCategory.RSTLO,
            latitude: 45,
            longitude: 7,
            anonymous: false,
            photo1: "/img.jpg"
        });
        // First, MPRO assigns the report
        await reportRepo.updateReportAsMPRO(report.id, Status.ASSIGNED);
        // Then, TOSM self-assigns the report
        await reportRepo.selfAssignReport(report.id, tosm.username);
        const updatedReport = await reportRepo.updateReportAsTOSM(report.id, Status.SUSPENDED, tosm.username);
        expect(updatedReport.status).toBe(Status.SUSPENDED);
    });

    it("send notification to citizen when TOSM updates report status to SUSPENDED", async () => {
        const tosm = await TestDataManager.getStaff('tosm_RSTLO');
        const citizen = await TestDataManager.getCitizen('citizen1');
        const report = await reportRepo.create({
            citizen,
            title: "Report for TOSM Suspension Notification",
            description: "Description",
            category: OfficeCategory.RSTLO,
            latitude: 45,
            longitude: 7,
            anonymous: false,
            photo1: "/img.jpg"
        });
        // First, MPRO assigns the report
        await reportRepo.updateReportAsMPRO(report.id, Status.ASSIGNED);
        // Then, TOSM self-assigns the report
        await reportRepo.selfAssignReport(report.id, tosm.username);
        await reportRepo.updateReportAsTOSM(report.id, Status.SUSPENDED, tosm.username);
        const notifications = await TestDataSource
            .getRepository(NotificationDAO)
            .find({ where: { citizen: { username: citizen.username } } });
        expect(notifications.length).toBe(2);
        const suspendedNotification = notifications.find(n => n.title === "Report Suspended");
        expect(suspendedNotification).toBeDefined();
        expect(suspendedNotification?.message).toContain('Your report "Report for TOSM Suspension Notification" has been suspended.');
    });

    it("throw BadRequestError when TOSM tries to update to RESOLVED when the report is SUSPENDED", async () => {
        const tosm = await TestDataManager.getStaff('tosm_RSTLO');
        const citizen = await TestDataManager.getCitizen('citizen1');
        const report = await reportRepo.create({
            citizen,
            title: "Report to Fail Update by TOSM",
            description: "Description",
            category: OfficeCategory.RSTLO,
            latitude: 45,
            longitude: 7,
            anonymous: false,
            photo1: "/img.jpg"
        });
        // First, MPRO assigns the report
        await reportRepo.updateReportAsMPRO(report.id, Status.ASSIGNED);
        // Then, TOSM self-assigns the report
        await reportRepo.selfAssignReport(report.id, tosm.username);
        await reportRepo.updateReportAsTOSM(report.id, Status.SUSPENDED, tosm.username);
        await expect(
            reportRepo.updateReportAsTOSM(report.id, Status.RESOLVED, tosm.username)
        ).rejects.toThrow(BadRequestError);
    });

    it("update status for TOSM to IN_PROGRESS", async () => {
        const tosm = await TestDataManager.getStaff('tosm_RSTLO');
        const citizen = await TestDataManager.getCitizen('citizen1');
        const report = await reportRepo.create({
            citizen,
            title: "Report to Start by TOSM",
            description: "Description",
            category: OfficeCategory.RSTLO,
            latitude: 45,
            longitude: 7,
            anonymous: false,
            photo1: "/img.jpg"
        });
        await reportRepo.updateReportAsMPRO(report.id, Status.ASSIGNED);
        await reportRepo.selfAssignReport(report.id, tosm.username);
        
        const updatedReport = await reportRepo.updateReportAsTOSM(report.id, Status.IN_PROGRESS, tosm.username);
        expect(updatedReport.status).toBe(Status.IN_PROGRESS);
    });

    it("send notification to citizen when TOSM updates report status to IN_PROGRESS", async () => {
        const tosm = await TestDataManager.getStaff('tosm_RSTLO');
        const citizen = await TestDataManager.getCitizen('citizen1');
        const report = await reportRepo.create({
            citizen,
            title: "Report for TOSM In Progress Notification",
            description: "Description",
            category: OfficeCategory.RSTLO,
            latitude: 45,
            longitude: 7,
            anonymous: false,
            photo1: "/img.jpg"
        });
        await reportRepo.updateReportAsMPRO(report.id, Status.ASSIGNED);
        await reportRepo.selfAssignReport(report.id, tosm.username);
        await reportRepo.updateReportAsTOSM(report.id, Status.IN_PROGRESS, tosm.username);
        
        const notifications = await TestDataSource
            .getRepository(NotificationDAO)
            .find({ where: { citizen: { username: citizen.username } } });
        
        expect(notifications.length).toBe(2);
        const inProgressNotification = notifications.find(n => n.title === "Report In Progress");
        expect(inProgressNotification).toBeDefined();
        expect(inProgressNotification?.message).toContain(`Your report "Report for TOSM In Progress Notification" has been assigned to ${tosm.username} and is now in progress.`);
    });

    it("throws BadRequestError when TOSM tries to update report not assigned to them", async () => {
        const tosm1 = await TestDataManager.getStaff('tosm_RSTLO');
        const tosm2 = await TestDataManager.getStaff('tosm_WSO');
        const citizen = await TestDataManager.getCitizen('citizen1');
        const report = await reportRepo.create({
            citizen,
            title: "Report assigned to another TOSM",
            description: "Description",
            category: OfficeCategory.WSO,
            latitude: 45,
            longitude: 7,
            anonymous: false,
            photo1: "/img.jpg"
        });
        await reportRepo.updateReportAsMPRO(report.id, Status.ASSIGNED);
        await reportRepo.selfAssignReport(report.id, tosm2.username);
        
        await expect(
            reportRepo.updateReportAsTOSM(report.id, Status.IN_PROGRESS, tosm1.username)
        ).rejects.toThrow(BadRequestError);
    });

    it("throws BadRequestError when TOSM tries to update report assigned to EM", async () => {
        const tosm = await TestDataManager.getStaff('tosm_RSTLO');
        const em = await TestDataManager.getStaff('em_RSTLO');
        const citizen = await TestDataManager.getCitizen('citizen1');
        const report = await reportRepo.create({
            citizen,
            title: "Report assigned to EM",
            description: "Description",
            category: OfficeCategory.RSTLO,
            latitude: 45,
            longitude: 7,
            anonymous: false,
            photo1: "/img.jpg"
        });
        await reportRepo.updateReportAsMPRO(report.id, Status.ASSIGNED);
        await reportRepo.selfAssignReport(report.id, tosm.username);
        await reportRepo.assignEMToReport(report.id, em.username, tosm.username);
        
        await expect(
            reportRepo.updateReportAsTOSM(report.id, Status.IN_PROGRESS, tosm.username)
        ).rejects.toThrow(BadRequestError);
    });

});

describe("ReportRepository - assignEMToReport (Story 24)", () => {

    let citizen: CitizenDAO;
    let tosm: StaffDAO;
    let em: StaffDAO;

    beforeEach(async () => {
        citizen = await TestDataManager.getCitizen("citizen1");
        tosm = await TestDataManager.getStaff("tosm_RSTLO");
        em = await TestDataManager.getStaff("em_RSTLO");
    });

    it("assigns EM successfully to a report", async () => {
        const report = await reportRepo.create({
            citizen,
            title: "Test assign EM",
            description: "Description",
            category: OfficeCategory.RSTLO,
            latitude: 45,
            longitude: 7,
            anonymous: false,
            photo1: "/img.jpg"
        });

        await reportRepo.updateReportAsMPRO(report.id, Status.ASSIGNED);
        await reportRepo.selfAssignReport(report.id, tosm.username);

        const updated = await reportRepo.assignEMToReport(report.id, em.username, tosm.username);

        expect(updated.assignedEM?.username).toBe(em.username);
        expect(updated.isExternal).toBe(true);
    });

    it("throws NotFoundError when report does not exist", async () => {
        await expect(
            reportRepo.assignEMToReport(123456, em.username, tosm.username)
        ).rejects.toThrow(NotFoundError);
    });

    it("throws BadRequestError if report is not assigned to TOSM", async () => {
        const report = await reportRepo.create({
            citizen,
            title: "Test wrong assign",
            description: "Description",
            category: OfficeCategory.RSTLO,
            latitude: 45,
            longitude: 7,
            anonymous: false,
            photo1: "/img.jpg"
        });

        await reportRepo.updateReportAsMPRO(report.id, Status.ASSIGNED);

        await expect(
            reportRepo.assignEMToReport(report.id, em.username, "wrongUser")
        ).rejects.toThrow("This report is not assigned to you.");
    });

    /** FIXED VERSION — CORRECT BEHAVIOR FOR STATUS TEST **/
    it("throws BadRequestError if report status is not ASSIGNED", async () => {
        const report = await reportRepo.create({
            citizen,
            title: "Test wrong status",
            description: "Description",
            category: OfficeCategory.RSTLO,
            latitude: 45,
            longitude: 7,
            anonymous: false,
            photo1: "/img.jpg"
        });

        // 🔥 MUST assign staff, otherwise first error triggers
        await TestDataSource.getRepository(ReportDAO).update(
            { id: report.id },
            { assignedStaff: tosm } // manually attach TOSM
        );

        // Status remains PENDING → triggers correct error branch

        await expect(
            reportRepo.assignEMToReport(report.id, em.username, tosm.username)
        ).rejects.toThrow("Only reports with ASSIGNED status can be assigned to an EM.");
    });

    it("throws BadRequestError if EM is not valid for the category", async () => {
        const wrongEM = await TestDataManager.getStaff("em_WSO");

        const report = await reportRepo.create({
            citizen,
            title: "Wrong EM test",
            description: "Description",
            category: OfficeCategory.RSTLO,
            latitude: 45,
            longitude: 7,
            anonymous: false,
            photo1: "/img.jpg"
        });

        await reportRepo.updateReportAsMPRO(report.id, Status.ASSIGNED);
        await reportRepo.selfAssignReport(report.id, tosm.username);

        await expect(
            reportRepo.assignEMToReport(report.id, wrongEM.username, tosm.username)
        ).rejects.toThrow("cannot be assigned to reports of category");
    });

    it("throws BadRequestError if EM already assigned", async () => {
        const report = await reportRepo.create({
            citizen,
            title: "Already EM",
            description: "Description",
            category: OfficeCategory.RSTLO,
            latitude: 45,
            longitude: 7,
            anonymous: false,
            photo1: "/img.jpg"
        });

        await reportRepo.updateReportAsMPRO(report.id, Status.ASSIGNED);
        await reportRepo.selfAssignReport(report.id, tosm.username);

        await reportRepo.assignEMToReport(report.id, em.username, tosm.username);

        await expect(
            reportRepo.assignEMToReport(report.id, em.username, tosm.username)
        ).rejects.toThrow("Report is already assigned to EM");
    });

    it("update report for EM to IN_PROGRESS", async () => {
        const tosm = await TestDataManager.getStaff('tosm_RSTLO');
        const em = await TestDataManager.getStaff('em_RSTLO');
        const citizen = await TestDataManager.getCitizen('citizen1');
        const report = await reportRepo.create({
            citizen,
            title: "Report to Update by EM",
            description: "Description",
            category: OfficeCategory.RSTLO,
            latitude: 45,
            longitude: 7,
            anonymous: false,
            photo1: "/img.jpg"
        });
        await reportRepo.updateReportAsMPRO(report.id, Status.ASSIGNED);
        await reportRepo.selfAssignReport(report.id, tosm.username);
        await reportRepo.assignEMToReport(report.id, em.username, tosm.username);
        
        const updatedReport = await reportRepo.updateReportAsEM(report.id, Status.IN_PROGRESS, em.username);
        expect(updatedReport.status).toBe(Status.IN_PROGRESS);
    });

    it("update report for EM to SUSPENDED", async () => {
        const tosm = await TestDataManager.getStaff('tosm_RSTLO');
        const em = await TestDataManager.getStaff('em_RSTLO');
        const citizen = await TestDataManager.getCitizen('citizen1');
        const report = await reportRepo.create({
            citizen,
            title: "Report to Suspend by EM",
            description: "Description",
            category: OfficeCategory.RSTLO,
            latitude: 45,
            longitude: 7,
            anonymous: false,
            photo1: "/img.jpg"
        });
        await reportRepo.updateReportAsMPRO(report.id, Status.ASSIGNED);
        await reportRepo.selfAssignReport(report.id, tosm.username);
        await reportRepo.assignEMToReport(report.id, em.username, tosm.username);
        
        const updatedReport = await reportRepo.updateReportAsEM(report.id, Status.SUSPENDED, em.username);
        expect(updatedReport.status).toBe(Status.SUSPENDED);
    });

    it("update report for EM to RESOLVED", async () => {
        const tosm = await TestDataManager.getStaff('tosm_RSTLO');
        const em = await TestDataManager.getStaff('em_RSTLO');
        const citizen = await TestDataManager.getCitizen('citizen1');
        const report = await reportRepo.create({
            citizen,
            title: "Report to Resolve by EM",
            description: "Description",
            category: OfficeCategory.RSTLO,
            latitude: 45,
            longitude: 7,
            anonymous: false,
            photo1: "/img.jpg"
        });
        await reportRepo.updateReportAsMPRO(report.id, Status.ASSIGNED);
        await reportRepo.selfAssignReport(report.id, tosm.username);
        await reportRepo.assignEMToReport(report.id, em.username, tosm.username);
        
        const updatedReport = await reportRepo.updateReportAsEM(report.id, Status.RESOLVED, em.username);
        expect(updatedReport.status).toBe(Status.RESOLVED);
    });

    it("throws NotFoundError when EM tries to update non-existent report", async () => {
        const em = await TestDataManager.getStaff('em_RSTLO');
        await expect(
            reportRepo.updateReportAsEM(99999, Status.RESOLVED, em.username)
        ).rejects.toThrow('Report with id \'99999\' not found');
    });

    it("throws BadRequestError when EM tries to update report not assigned to them", async () => {
        const tosm = await TestDataManager.getStaff('tosm_RSTLO');
        const em1 = await TestDataManager.getStaff('em_RSTLO');
        const em2 = await TestDataManager.getStaff('em_WSO');
        const citizen = await TestDataManager.getCitizen('citizen1');
        const report = await reportRepo.create({
            citizen,
            title: "Report assigned to another EM",
            description: "Description",
            category: OfficeCategory.RSTLO,
            latitude: 45,
            longitude: 7,
            anonymous: false,
            photo1: "/img.jpg"
        });
        await reportRepo.updateReportAsMPRO(report.id, Status.ASSIGNED);
        await reportRepo.selfAssignReport(report.id, tosm.username);
        await reportRepo.assignEMToReport(report.id, em1.username, tosm.username);
        
        await expect(
            reportRepo.updateReportAsEM(report.id, Status.IN_PROGRESS, em2.username)
        ).rejects.toThrow(BadRequestError);
    });

    it("throws BadRequestError when EM tries to update report without TOSM assignment", async () => {
        const em = await TestDataManager.getStaff('em_RSTLO');
        const citizen = await TestDataManager.getCitizen('citizen1');
        const report = await reportRepo.create({
            citizen,
            title: "Report without TOSM",
            description: "Description",
            category: OfficeCategory.RSTLO,
            latitude: 45,
            longitude: 7,
            anonymous: false,
            photo1: "/img.jpg"
        });
        await reportRepo.updateReportAsMPRO(report.id, Status.ASSIGNED);
        
        await expect(
            reportRepo.updateReportAsEM(report.id, Status.IN_PROGRESS, em.username)
        ).rejects.toThrow(BadRequestError);
    });

    it("send notification to citizen when EM updates report status to RESOLVED", async () => {
        const tosm = await TestDataManager.getStaff('tosm_RSTLO');
        const em = await TestDataManager.getStaff('em_RSTLO');
        const citizen = await TestDataManager.getCitizen('citizen1');
        const report = await reportRepo.create({
            citizen,
            title: "Report for EM Notification",
            description: "Description",
            category: OfficeCategory.RSTLO,
            latitude: 45,
            longitude: 7,
            anonymous: false,
            photo1: "/img.jpg"
        });
        await reportRepo.updateReportAsMPRO(report.id, Status.ASSIGNED);
        await reportRepo.selfAssignReport(report.id, tosm.username);
        await reportRepo.assignEMToReport(report.id, em.username, tosm.username);
        await reportRepo.updateReportAsEM(report.id, Status.RESOLVED, em.username);
        
        const notifications = await TestDataSource
            .getRepository(NotificationDAO)
            .find({ where: { citizen: { username: citizen.username } } });
        
        expect(notifications.length).toBe(2); // MPRO + EM
        const resolvedNotification = notifications.find(n => n.title === "Report Resolved");
        expect(resolvedNotification).toBeDefined();
        expect(resolvedNotification?.message).toContain('Your report "Report for EM Notification" has been marked as resolved.');
    });

    it("send notification to citizen when EM updates report status to SUSPENDED", async () => {
        const tosm = await TestDataManager.getStaff('tosm_RSTLO');
        const em = await TestDataManager.getStaff('em_RSTLO');
        const citizen = await TestDataManager.getCitizen('citizen1');
        const report = await reportRepo.create({
            citizen,
            title: "Report for EM Suspension Notification",
            description: "Description",
            category: OfficeCategory.RSTLO,
            latitude: 45,
            longitude: 7,
            anonymous: false,
            photo1: "/img.jpg"
        });
        await reportRepo.updateReportAsMPRO(report.id, Status.ASSIGNED);
        await reportRepo.selfAssignReport(report.id, tosm.username);
        await reportRepo.assignEMToReport(report.id, em.username, tosm.username);
        await reportRepo.updateReportAsEM(report.id, Status.SUSPENDED, em.username);
        
        const notifications = await TestDataSource
            .getRepository(NotificationDAO)
            .find({ where: { citizen: { username: citizen.username } } });
        
        expect(notifications.length).toBe(2);
        const suspendedNotification = notifications.find(n => n.title === "Report Suspended");
        expect(suspendedNotification).toBeDefined();
        expect(suspendedNotification?.message).toContain('Your report "Report for EM Suspension Notification" has been suspended.');
    });

    it("send notification to citizen when EM updates report status to IN_PROGRESS", async () => {
        const tosm = await TestDataManager.getStaff('tosm_RSTLO');
        const em = await TestDataManager.getStaff('em_RSTLO');
        const citizen = await TestDataManager.getCitizen('citizen1');
        const report = await reportRepo.create({
            citizen,
            title: "Report for EM In Progress Notification",
            description: "Description",
            category: OfficeCategory.RSTLO,
            latitude: 45,
            longitude: 7,
            anonymous: false,
            photo1: "/img.jpg"
        });
        await reportRepo.updateReportAsMPRO(report.id, Status.ASSIGNED);
        await reportRepo.selfAssignReport(report.id, tosm.username);
        await reportRepo.assignEMToReport(report.id, em.username, tosm.username);
        await reportRepo.updateReportAsEM(report.id, Status.IN_PROGRESS, em.username);
        
        const notifications = await TestDataSource
            .getRepository(NotificationDAO)
            .find({ where: { citizen: { username: citizen.username } } });
        
        expect(notifications.length).toBe(2);
        const inProgressNotification = notifications.find(n => n.title === "Report In Progress");
        expect(inProgressNotification).toBeDefined();
        expect(inProgressNotification?.message).toContain(`Your report "Report for EM In Progress Notification" has been assigned to ${em.username} and is now in progress.`);
    });

    it("throws BadRequestError when EM tries to update to RESOLVED when report is SUSPENDED", async () => {
        const tosm = await TestDataManager.getStaff('tosm_RSTLO');
        const em = await TestDataManager.getStaff('em_RSTLO');
        const citizen = await TestDataManager.getCitizen('citizen1');
        const report = await reportRepo.create({
            citizen,
            title: "Report to Fail Update by EM",
            description: "Description",
            category: OfficeCategory.RSTLO,
            latitude: 45,
            longitude: 7,
            anonymous: false,
            photo1: "/img.jpg"
        });
        await reportRepo.updateReportAsMPRO(report.id, Status.ASSIGNED);
        await reportRepo.selfAssignReport(report.id, tosm.username);
        await reportRepo.assignEMToReport(report.id, em.username, tosm.username);
        await reportRepo.updateReportAsEM(report.id, Status.SUSPENDED, em.username);
        
        await expect(
            reportRepo.updateReportAsEM(report.id, Status.RESOLVED, em.username)
        ).rejects.toThrow(BadRequestError);
    });

    it("should add a public message to the report by TOSM", async () => {
        const tosm = await TestDataManager.getStaff('tosm_RSTLO');
        const citizen = await TestDataManager.getCitizen('citizen1');

        const report = await reportRepo.create({
            citizen,
            title: "Report for TOSM Message",
            description: "Description",
            category: OfficeCategory.RSTLO,
            latitude: 45,
            longitude: 7,
            anonymous: false,
            photo1: "/img.jpg"
        });

        await reportRepo.updateReportAsMPRO(report.id, Status.ASSIGNED);
        await reportRepo.selfAssignReport(report.id, tosm.username);
        const message = "This is a public message from TOSM.";

        const updatedReport = await reportRepo.addMessageToReport(report, message, tosm, false);
        const addedMessage = updatedReport.messages
                                .find(msg => msg.message === message);

        expect(addedMessage).toBeDefined();
        expect(addedMessage?.isPrivate).toBe(false);
        expect(addedMessage?.staff?.username).toBe(tosm.username);
        expect(addedMessage?.message).toBe(message);
    });


    it("should add a private message to the report by TOSM", async () => {
        const tosm = await TestDataManager.getStaff('tosm_RSTLO');
        const citizen = await TestDataManager.getCitizen('citizen1');

        const report = await reportRepo.create({
            citizen,
            title: "Report for TOSM Message",
            description: "Description",
            category: OfficeCategory.RSTLO,
            latitude: 45,
            longitude: 7,
            anonymous: false,
            photo1: "/img.jpg"
        });

        await reportRepo.updateReportAsMPRO(report.id, Status.ASSIGNED);
        await reportRepo.selfAssignReport(report.id, tosm.username);
        const message = "This is a private message from TOSM.";

        const updatedReport = await reportRepo.addMessageToReport(report, message, tosm, true);
        const addedMessage = updatedReport.messages
                                .find(msg => msg.message === message);

        expect(addedMessage).toBeDefined();
        expect(addedMessage?.isPrivate).toBe(true);
        expect(addedMessage?.staff?.username).toBe(tosm.username);
        expect(addedMessage?.message).toBe(message);
    });

    it("should add a private message to the report by EM", async () => {
        const em = await TestDataManager.getStaff('em_RSTLO');
        const citizen = await TestDataManager.getCitizen('citizen1');

        const report = await reportRepo.create({
            citizen,
            title: "Report for EM Message",
            description: "Description",
            category: OfficeCategory.RSTLO,
            latitude: 45,
            longitude: 7,
            anonymous: false,
            photo1: "/img.jpg"
        });

        await reportRepo.updateReportAsMPRO(report.id, Status.ASSIGNED);
        await reportRepo.selfAssignReport(report.id, tosm.username);
        await reportRepo.assignEMToReport(report.id, em.username, tosm.username);
        const message = "This is a private message from EM.";

        const updatedReport = await reportRepo.addMessageToReport(report, message, em, true);
        const addedMessage = updatedReport.messages
                                .find(msg => msg.message === message);

        expect(addedMessage).toBeDefined();
        expect(addedMessage?.isPrivate).toBe(true);
        expect(addedMessage?.staff?.username).toBe(em.username);
        expect(addedMessage?.message).toBe(message);
    });

    it("should get all messages for TOSM", async () => {
        const citizen = await TestDataManager.getCitizen('citizen1');
        const repo1 = await reportRepo.create({
            citizen,
            title: "Report for TOSM Message Retrieval",
            description: "Description",
            category: OfficeCategory.RSTLO,
            latitude: 45,
            longitude: 7,
            anonymous: false,
            photo1: "/img.jpg"
        });

        const message1 = "Public message from TOSM.";
        const message2 = "Private message from TOSM.";
        await reportRepo.updateReportAsMPRO(repo1.id, Status.ASSIGNED);
        await reportRepo.selfAssignReport(repo1.id, tosm.username);

        await reportRepo.addMessageToReport(repo1, message1, tosm, false);
        await reportRepo.addMessageToReport(repo1, message2, tosm, true);

        const messages = await reportRepo.getAllMessages(repo1.id)
        expect(messages.length).toBe(2);
        const publicMessage = messages.find(msg => msg.message === message1);
        const privateMessage = messages.find(msg => msg.message === message2);
        expect(publicMessage).toBeDefined();
        expect(privateMessage).toBeDefined();
    });

        it("should get all public messages for TOSM", async () => {
        const citizen = await TestDataManager.getCitizen('citizen1');
        const repo1 = await reportRepo.create({
            citizen,
            title: "Report for TOSM Message Retrieval",
            description: "Description",
            category: OfficeCategory.RSTLO,
            latitude: 45,
            longitude: 7,
            anonymous: false,
            photo1: "/img.jpg"
        });

        const message1 = "Public message from TOSM.";
        const message2 = "Private message from TOSM.";
        await reportRepo.updateReportAsMPRO(repo1.id, Status.ASSIGNED);
        await reportRepo.selfAssignReport(repo1.id, tosm.username);

        await reportRepo.addMessageToReport(repo1, message1, tosm, false);
        await reportRepo.addMessageToReport(repo1, message2, tosm, true);

        const messages = await reportRepo.getAllPublicMessages(repo1.id);
        expect(messages.length).toBe(1);
        const publicMessage = messages.find(msg => msg.message === message1);
        expect(publicMessage).toBeDefined();
    });

});
