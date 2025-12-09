import { ReportRepository } from "@repositories/reportRepository";
import { CitizenRepository } from "@repositories/citizenRepository";
import { StaffRepository } from "@repositories/staffRepository";
import { OfficeRepository } from "@repositories/officeRepository";
import { ReportDAO, Status } from "@dao/reportDAO";
import { CitizenDAO } from "@dao/citizenDAO";
import { StaffDAO } from "@dao/staffDAO";
import { OfficeDAO, OfficeCategory } from "@dao/officeDAO";
import { NotFoundError } from "@errors/NotFoundError";
import { BadRequestError } from "@errors/BadRequestError";
import { initializeTestDataSource, closeTestDataSource, TestDataSource } from "../../setup/test-datasource";
import { NotificationRepository } from "@repositories/notificationRepository";
import { NotificationDAO } from "@models/dao/notificationDAO";
import { MessageDAO } from "@models/dao/messageDAO";
import { beforeAllE2e, DEFAULT_CITIZENS, DEFAULT_STAFF, TestDataManager } from "../../e2e/lifecycle";

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
        expect(saved?.citizen.username).toBe(DEFAULT_CITIZENS.citizen1.username);
    });

    it("stores photo2 and photo3 when provided", async () => {
        const citizen = await TestDataManager.getCitizen('citizen2');

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
        const citizen = await TestDataManager.getCitizen('citizen3');

        await reportRepo.create(
            citizen,
            "Single photo report",
            "Testing single photo",
            OfficeCategory.PLO,
            45.0,
            7.5,
            false,
            "/single.jpg"
        );

        const saved = await TestDataSource
            .getRepository(ReportDAO)
            .findOneBy({ title: "Single photo report" });

        expect(saved?.photo1).toBe("/single.jpg");
        expect(saved?.photo2).toBeNull();
        expect(saved?.photo3).toBeNull();
    });

    it("gets all reports", async () => {
        const citizen = await TestDataManager.getCitizen('citizen1');

        await reportRepo.create(
            citizen,
            "Report 1",
            "First report",
            OfficeCategory.RSTLO,
            45.0,
            7.0,
            false,
            "/r1.jpg"
        );

        await reportRepo.create(
            citizen,
            "Report 2",
            "Second report",
            OfficeCategory.WSO,
            45.1,
            7.1,
            false,
            "/r2.jpg"
        );

        const reports = await reportRepo.getAllReports();
        expect(reports.length).toBe(2);
    });

    it("gets report by id", async () => {
        const citizen = await TestDataManager.getCitizen('citizen1');

        const created = await reportRepo.create(
            citizen,
            "Find by ID",
            "Description",
            OfficeCategory.RSTLO,
            45.0,
            7.0,
            false,
            "/img.jpg"
        );

        const found = await reportRepo.getReportById(created.id);
        expect(found).toBeDefined();
        expect(found?.title).toBe("Find by ID");
    });

    it("returns null for non-existent report id", async () => {
        const report = await reportRepo.getReportById(99999);
        expect(report).toBeNull();
    });

    it("gets reports by citizen username", async () => {
        const citizen = await TestDataManager.getCitizen('citizen2');

        await reportRepo.create(
            citizen,
            "Citizen Report 1",
            "First",
            OfficeCategory.RSTLO,
            45.0,
            7.0,
            false,
            "/c1.jpg"
        );

        await reportRepo.create(
            citizen,
            "Citizen Report 2",
            "Second",
            OfficeCategory.WSO,
            45.1,
            7.1,
            false,
            "/c2.jpg"
        );

        const reports = await reportRepo.getReportsByCitizenUsername(DEFAULT_CITIZENS.citizen2.username);
        expect(reports.length).toBe(2);
    });

    it("updates report status successfully", async () => {
        const citizen = await TestDataManager.getCitizen('citizen1');
        const staff = await TestDataManager.getStaff('tosm_RSTLO');

        const report = await reportRepo.create(
            citizen,
            "Status Update Test",
            "Description",
            OfficeCategory.RSTLO,
            45.0,
            7.0,
            false,
            "/img.jpg"
        );

        await reportRepo.updateStatus(report.id, Status.ASSIGNED, staff);

        const updated = await reportRepo.getReportById(report.id);
        expect(updated?.status).toBe(Status.ASSIGNED);
        expect(updated?.staff?.username).toBe(DEFAULT_STAFF.tosm_RSTLO.username);
    });

    it("updates report category successfully", async () => {
        const citizen = await TestDataManager.getCitizen('citizen1');

        const report = await reportRepo.create(
            citizen,
            "Category Update Test",
            "Description",
            OfficeCategory.RSTLO,
            45.0,
            7.0,
            false,
            "/img.jpg"
        );

        await reportRepo.updateCategory(report.id, OfficeCategory.WSO);

        const updated = await reportRepo.getReportById(report.id);
        expect(updated?.category).toBe(OfficeCategory.WSO);
    });

    it("throws NotFoundError when updating non-existent report status", async () => {
        const staff = await TestDataManager.getStaff('tosm_RSTLO');

        await expect(
            reportRepo.updateStatus(99999, Status.ASSIGNED, staff)
        ).rejects.toThrow(NotFoundError);
    });

    it("throws NotFoundError when updating non-existent report category", async () => {
        await expect(
            reportRepo.updateCategory(99999, OfficeCategory.WSO)
        ).rejects.toThrow(NotFoundError);
    });

    it("filters reports by status", async () => {
        const citizen = await TestDataManager.getCitizen('citizen1');
        const staff = await TestDataManager.getStaff('tosm_RSTLO');

        const report1 = await reportRepo.create(
            citizen,
            "Pending Report",
            "Description",
            OfficeCategory.RSTLO,
            45.0,
            7.0,
            false,
            "/img.jpg"
        );

        const report2 = await reportRepo.create(
            citizen,
            "Assigned Report",
            "Description",
            OfficeCategory.RSTLO,
            45.0,
            7.0,
            false,
            "/img.jpg"
        );

        await reportRepo.updateStatus(report2.id, Status.ASSIGNED, staff);

        const filters = { status: Status.ASSIGNED };
        const filtered = await reportRepo.getReportsWithFilters(filters);
        
        expect(filtered.length).toBe(1);
        expect(filtered[0].title).toBe("Assigned Report");
    });

    it("filters reports by category", async () => {
        const citizen = await TestDataManager.getCitizen('citizen1');

        await reportRepo.create(
            citizen,
            "RSTLO Report",
            "Description",
            OfficeCategory.RSTLO,
            45.0,
            7.0,
            false,
            "/img.jpg"
        );

        await reportRepo.create(
            citizen,
            "WSO Report",
            "Description",
            OfficeCategory.WSO,
            45.0,
            7.0,
            false,
            "/img.jpg"
        );

        const filters = { category: OfficeCategory.WSO };
        const filtered = await reportRepo.getReportsWithFilters(filters);
        
        expect(filtered.length).toBe(1);
        expect(filtered[0].title).toBe("WSO Report");
    });

    it("filters reports by citizen username", async () => {
        const citizen1 = await TestDataManager.getCitizen('citizen1');
        const citizen2 = await TestDataManager.getCitizen('citizen2');

        await reportRepo.create(
            citizen1,
            "Citizen1 Report",
            "Description",
            OfficeCategory.RSTLO,
            45.0,
            7.0,
            false,
            "/img.jpg"
        );

        await reportRepo.create(
            citizen2,
            "Citizen2 Report",
            "Description",
            OfficeCategory.WSO,
            45.0,
            7.0,
            false,
            "/img.jpg"
        );

        const filters = { citizen_username: DEFAULT_CITIZENS.citizen1.username };
        const filtered = await reportRepo.getReportsWithFilters(filters);
        
        expect(filtered.length).toBe(1);
        expect(filtered[0].citizen.username).toBe(DEFAULT_CITIZENS.citizen1.username);
    });

    it("filters reports by title", async () => {
        const citizen = await TestDataManager.getCitizen('citizen1');

        await reportRepo.create(
            citizen,
            "Broken Light",
            "Description",
            OfficeCategory.RSTLO,
            45.0,
            7.0,
            false,
            "/img.jpg"
        );

        await reportRepo.create(
            citizen,
            "Water Leak",
            "Description",
            OfficeCategory.WSO,
            45.0,
            7.0,
            false,
            "/img.jpg"
        );

        const filters = { title: "Broken_Light" };
        const filtered = await reportRepo.getReportsWithFilters(filters);
        
        expect(filtered.length).toBe(1);
        expect(filtered[0].title).toBe("Broken Light");
    });

    it("creates anonymous report without citizen reference", async () => {
        const citizen = await TestDataManager.getCitizen('citizen1');

        const report = await reportRepo.create(
            citizen,
            "Anonymous Report",
            "Description",
            OfficeCategory.RSTLO,
            45.0,
            7.0,
            true, // anonymous
            "/img.jpg"
        );

        expect(report.anonymous).toBe(true);
    });
});