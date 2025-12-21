import { createReport, addMessageToReport, getAllMessages, selfAssignReport, updateReportAsMPRO, assignReportToEM } from "@controllers/reportController";
import { CitizenRepository } from "@repositories/citizenRepository";
import { ReportRepository } from "@repositories/reportRepository";
import { ReportDAO, Status } from "@dao/reportDAO";
import { initializeTestDataSource, closeTestDataSource, TestDataSource } from "../../setup/test-datasource";
import { BadRequestError } from "@errors/BadRequestError";
import { NotFoundError } from "@errors/NotFoundError";
import { MessageDAO } from "@dao/messageDAO";
import { StaffRepository } from "@repositories/staffRepository";
import { OfficeRepository } from "@repositories/officeRepository";
import { OfficeCategory } from "@dao/officeDAO";
import { NotificationDAO } from "@dao/notificationDAO";
import { beforeAllE2e, DEFAULT_CITIZENS, DEFAULT_STAFF, TestDataManager } from "../../e2e/lifecycle";

let citizenRepo: CitizenRepository;
let reportRepo: ReportRepository;
let staffRepo: StaffRepository;
let officeRepo: OfficeRepository;

const fakeBody = {
    title: "Broken light",
    description: "Streetlight is not working",
    category: "Road Signs and Traffic Lights",
    latitude: "45.07",
    longitude: "7.68",
    anonymous: false
};

const fakeFiles = [
    { filename: "img1.jpg" } as Express.Multer.File
];

beforeAll(async () => {
    await initializeTestDataSource();
    await beforeAllE2e();
    citizenRepo = new CitizenRepository();
    reportRepo = new ReportRepository();
    staffRepo = new StaffRepository();
    officeRepo = new OfficeRepository();
});

afterAll(async () => {
    await closeTestDataSource();
});

beforeEach(async () => {
    await TestDataSource.getRepository(NotificationDAO).clear();
    await TestDataSource.getRepository(MessageDAO).clear();
    await TestDataSource.getRepository(ReportDAO).clear();
});

describe("ReportController - createReport", () => {
    
    it("creates a report successfully with default citizen", async () => {
        const report = await createReport(fakeBody, DEFAULT_CITIZENS.citizen1.username, fakeFiles);

        expect(report.title).toBe(fakeBody.title);
        expect(report.photo1).toBe("/uploads/reports/img1.jpg");
        expect(report.citizen.username).toBe(DEFAULT_CITIZENS.citizen1.username);
    });

    it("throws NotFoundError when citizen is missing", async () => {
        await expect(
            createReport(fakeBody, "unknownUser", fakeFiles)
        ).rejects.toThrow(NotFoundError);
    });

    it("throws BadRequestError for missing required fields", async () => {
        const incomplete = {
            title: "",
            description: "",
            category: "Municipal Organization",
            latitude: undefined,
            longitude: undefined,
            anonymous: false
        };

        const fakeFiles: any[] = [
            { filename: "test1.png" },
        ];

        await expect(
            createReport(incomplete, DEFAULT_CITIZENS.citizen1.username, fakeFiles)
        ).rejects.toThrow(BadRequestError);
    });

    it("throws BadRequestError when no photos are provided", async () => {
        await expect(
            createReport(fakeBody, DEFAULT_CITIZENS.citizen1.username, [])
        ).rejects.toThrow("At least one photo is required");
    });

    it("handles multiple photos correctly", async () => {
        const files = [
            { filename: "img1.jpg" } as Express.Multer.File,
            { filename: "img2.jpg" } as Express.Multer.File,
            { filename: "img3.jpg" } as Express.Multer.File
        ];

        const report = await createReport(fakeBody, DEFAULT_CITIZENS.citizen2.username, files);

        expect(report.photo1).toBe("/uploads/reports/img1.jpg");
        expect(report.photo2).toBe("/uploads/reports/img2.jpg");
        expect(report.photo3).toBe("/uploads/reports/img3.jpg");
    });

    it("sets photo2 and photo3 to undefined when only 1 photo is provided", async () => {
        const files = [
            { filename: "one.jpg" } as Express.Multer.File
        ];

        const report = await createReport(fakeBody, DEFAULT_CITIZENS.citizen3.username, files);

        expect(report.photo2).toBeNull();
        expect(report.photo3).toBeNull();
    });

    it("sets photo3 to undefined when exactly 2 photos are provided", async () => {
        const files = [
            { filename: "one.jpg" } as Express.Multer.File,
            { filename: "two.jpg" } as Express.Multer.File
        ];

        const report = await createReport(fakeBody, DEFAULT_CITIZENS.citizen1.username, files);

        expect(report.photo1).toBe("/uploads/reports/one.jpg");
        expect(report.photo2).toBe("/uploads/reports/two.jpg");
        expect(report.photo3).toBeNull();
    });

    it("validates category is valid", async () => {
        const invalidBody = { ...fakeBody, category: "Invalid Category" };

        await expect(
            createReport(invalidBody, DEFAULT_CITIZENS.citizen1.username, fakeFiles)
        ).rejects.toThrow();
    });
});

describe("ReportController - updateReportAsEM", () => {
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
            photo1: "/img.jpg"
        });
    });

    it("should update report status as EM", async () => {
        await reportRepo.updateReportAsMPRO(report.id, Status.ASSIGNED);

        const staff = await TestDataManager.getStaff('tosm_RSTLO');

        await reportRepo.selfAssignReport(report.id, staff.username);
        await reportRepo.assignEMToReport(report.id, DEFAULT_STAFF.em_RSTLO.username, staff.username);
        const updatedReport = await reportRepo.updateReportAsEM(report.id, Status.IN_PROGRESS, DEFAULT_STAFF.em_RSTLO.username);
        expect(updatedReport.status).toBe(Status.IN_PROGRESS);
    });
})

describe("ReportController - addMessageToReport", () => {
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
            photo1: "/img.jpg"
        });
    });

    it("should add message to report from staff", async () => {
        const staff = await TestDataManager.getStaff('tosm_RSTLO');

        await reportRepo.updateReportAsMPRO(report.id, Status.ASSIGNED);

        await reportRepo.selfAssignReport(report.id, staff.username);
        
        const updatedReport = await addMessageToReport(
            report.id,
            staff.username,
            "STAFF",
            "Test message from staff",
            false
        );

        expect(updatedReport).toBeDefined();
        expect(updatedReport.title).toBe("Test Report");
    });

    it("should throw NotFoundError for non-existent report", async () => {
        await expect(
            addMessageToReport(
                99999,
                DEFAULT_CITIZENS.citizen1.username,
                "CITIZEN",
                "Test message"
            )
        ).rejects.toThrow(NotFoundError);
    });
});

describe("ReportController - getAllMessages", () => {
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
            photo1: "/img.jpg"
        });
    });

    it("should get all messages for a report", async () => {
        const staff = await TestDataManager.getStaff('tosm_RSTLO');

        await reportRepo.updateReportAsMPRO(report.id, Status.ASSIGNED);

        await reportRepo.selfAssignReport(report.id, staff.username);
        
        await addMessageToReport(
            report.id,
            DEFAULT_CITIZENS.citizen1.username,  
            "CITIZEN",                            
            "Message 1"
        );
        await addMessageToReport(
            report.id,
            DEFAULT_STAFF.tosm_RSTLO.username,
            "STAFF",
            "Message 2",
            true
        );

        const messages = await getAllMessages(report.id, "STAFF");

        expect(messages).toHaveLength(2);
        expect(messages[0].message).toBe("Message 1");  
        expect(messages[1].message).toBe("Message 2");
    });

    it("should return empty array for report with no messages", async () => {
        const messages = await getAllMessages(report.id, "STAFF");  
        expect(messages).toEqual([]);
    });

    it("should throw NotFoundError for non-existent report", async () => {
        await expect(
            getAllMessages(99999, "CITIZEN")  
        ).rejects.toThrow(NotFoundError);
    });

    it("should add a public message to report from TOSM", async () => {
        const citizen = await TestDataManager.getCitizen('citizen1');
        const report = await reportRepo.create({
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
        
        await updateReportAsMPRO(report.id, Status.ASSIGNED);
        await selfAssignReport(report.id, DEFAULT_STAFF.tosm_RSTLO.username);

        const updatedReport = await addMessageToReport(
            report.id,
            DEFAULT_STAFF.tosm_RSTLO.username,
            "STAFF",
            message1,
            false
        );

        expect(updatedReport).toBeDefined();
        expect(updatedReport.title).toBe("Report for TOSM Message Retrieval");
        expect(updatedReport.messages).toHaveLength(1);
        expect(updatedReport.messages![0].message).toBe(message1);
    });

    it("should add a private message to report from TOSM", async () => {
        const citizen = await TestDataManager.getCitizen('citizen1');
        const report = await reportRepo.create({
            citizen,
            title: "Report for TOSM Message Retrieval",
            description: "Description",
            category: OfficeCategory.RSTLO,
            latitude: 45,
            longitude: 7,
            anonymous: false,
            photo1: "/img.jpg"
        });

        const message1 = "Private message from TOSM.";

        await updateReportAsMPRO(report.id, Status.ASSIGNED);
        await selfAssignReport(report.id, DEFAULT_STAFF.tosm_RSTLO.username);

        const updatedReport = await addMessageToReport(
            report.id,
            DEFAULT_STAFF.tosm_RSTLO.username,
            "STAFF",
            message1,
            true
        );

        expect(updatedReport).toBeDefined();
        expect(updatedReport.title).toBe("Report for TOSM Message Retrieval");
        expect(updatedReport.messages).toHaveLength(1);
        expect(updatedReport.messages![0].message).toBe(message1);
    });

    it("should add a message to report from EM", async () => {
        const citizen = await TestDataManager.getCitizen('citizen1');
        const report = await reportRepo.create({
            citizen,
            title: "Report for EM Message Retrieval",
            description: "Description",
            category: OfficeCategory.RSTLO,
            latitude: 45,
            longitude: 7,
            anonymous: false,
            photo1: "/img.jpg"
        });

        const message1 = "Private message from EM.";

        await updateReportAsMPRO(report.id, Status.ASSIGNED);
        await selfAssignReport(report.id, DEFAULT_STAFF.tosm_RSTLO.username);
        await assignReportToEM(report.id, DEFAULT_STAFF.em_RSTLO.username, DEFAULT_STAFF.tosm_RSTLO.username);

        const updatedReport = await addMessageToReport(
            report.id,
            DEFAULT_STAFF.em_RSTLO.username,
            "STAFF",
            message1,
            true
        );

        expect(updatedReport).toBeDefined();
        expect(updatedReport.title).toBe("Report for EM Message Retrieval");
        expect(updatedReport.messages).toHaveLength(1);
        expect(updatedReport.messages![0].message).toBe(message1);
    });

    it("should throw BadRequestError when TOSM tries to add message to unassigned report", async () => {
        const citizen = await TestDataManager.getCitizen('citizen1');
        const report = await reportRepo.create({
            citizen,
            title: "Report for TOSM Unassigned Message Test",
            description: "Description",
            category: OfficeCategory.RSTLO,
            latitude: 45,
            longitude: 7,
            anonymous: false,
            photo1: "/img.jpg"
        });
        const message1 = "Message from unassigned TOSM.";

        await expect(
            addMessageToReport(
                report.id,
                DEFAULT_STAFF.em_RSTLO.username,
                "STAFF",
                message1,
                true
            )
        ).rejects.toThrow(BadRequestError);

    });

    it("should throw BadRequestError when EM is not assigned to the report", async () => {
        const citizen = await TestDataManager.getCitizen('citizen1');
        const report = await reportRepo.create({
            citizen,
            title: "Report for EM Unassigned Message Test",
            description: "Description",
            category: OfficeCategory.RSTLO,
            latitude: 45,
            longitude: 7,
            anonymous: false,
            photo1: "/img.jpg"
        });

        await updateReportAsMPRO(report.id, Status.ASSIGNED);
        await selfAssignReport(report.id, DEFAULT_STAFF.tosm_RSTLO.username);

        const message1 = "Message from unassigned EM.";
        await expect(
            addMessageToReport(
                report.id,
                DEFAULT_STAFF.em_RSTLO.username,
                "STAFF",
                message1,
                true
            )
        ).rejects.toThrow(BadRequestError);
    });

    it("should get all messages", async () => {
        const citizen = await TestDataManager.getCitizen('citizen1');
        const report = await reportRepo.create({
            citizen,
            title: "Report for EM Message Retrieval",
            description: "Description",
            category: OfficeCategory.RSTLO,
            latitude: 45,
            longitude: 7,
            anonymous: false,
            photo1: "/img.jpg"
        });

        const message1 = "Public message from TOSM.";
        const message2 = "Private message from TOSM.";

        await updateReportAsMPRO(report.id, Status.ASSIGNED);
        await selfAssignReport(report.id, DEFAULT_STAFF.tosm_RSTLO.username);

        await addMessageToReport(
            report.id,
            DEFAULT_STAFF.tosm_RSTLO.username,
            "STAFF",
            message1,
            false
        );

        await addMessageToReport(
            report.id,
            DEFAULT_STAFF.tosm_RSTLO.username,
            "STAFF",
            message2,
            false
        );

        const messages = await getAllMessages(report.id, "STAFF");

        expect(messages).toHaveLength(2);
    });

    it("should throw NotFoundError when getting messages for non-existent report", async () => {    
        await expect(
            getAllMessages(99999, "STAFF")
        ).rejects.toThrow(NotFoundError);
    });
        

});