import { createReport, uploadReportPictures, addMessageToReport, getAllMessages } from "@controllers/reportController";
import { CitizenRepository } from "@repositories/citizenRepository";
import { ReportRepository } from "@repositories/reportRepository";
import { CitizenDAO } from "@dao/citizenDAO";
import { ReportDAO } from "@dao/reportDAO";
import { initializeTestDataSource, closeTestDataSource, TestDataSource } from "../../setup/test-datasource";
import { BadRequestError } from "@errors/BadRequestError";
import { NotFoundError } from "@errors/NotFoundError";
import fs from "fs";
import { StaffDAO, StaffRole } from "@dao/staffDAO";
import { MessageDAO } from "@dao/messageDAO";
import { StaffRepository } from "@repositories/staffRepository";
import { OfficeRepository } from "@repositories/officeRepository";
import { OfficeDAO, OfficeCategory } from "@dao/officeDAO";
import {NotificationDAO} from "@dao/notificationDAO";

let citizenRepo: CitizenRepository;
let reportRepo: ReportRepository;
let staffRepo: StaffRepository;
let officeRepo: OfficeRepository;

const fakeCitizen = {
    email: "john@example.com",
    username: "johnny",
    name: "John",
    surname: "Doe",
    password: "pass123",
    receive_emails: true,
    profilePicture: "",
    telegram_username: ""
};

const fakeStaff = {
    username: "staff1",
    name: "Staff",
    surname: "Member",
    password: "staffpass",
    role: StaffRole.TOSM,
    officeName: "Roads and Urban Furnishings Office"
};

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
    citizenRepo = new CitizenRepository();
    reportRepo = new ReportRepository();
    staffRepo = new StaffRepository();
    officeRepo = new OfficeRepository();
});

afterAll(async () => {
    await closeTestDataSource();
});

beforeEach(async () => {
    // Clear tables in the correct order to respect foreign key constraints
    await TestDataSource.getRepository(NotificationDAO).clear();
    await TestDataSource.getRepository(MessageDAO).clear();
    await TestDataSource.getRepository(ReportDAO).clear();
    await TestDataSource.getRepository(StaffDAO).clear();
    await TestDataSource.getRepository(CitizenDAO).clear();
    await TestDataSource.getRepository(OfficeDAO).clear();
});

describe("ReportController - createReport", () => {
    
    it("creates a report successfully", async () => {
        await citizenRepo.createCitizen(
            fakeCitizen.email,
            fakeCitizen.username,
            fakeCitizen.name,
            fakeCitizen.surname,
            fakeCitizen.password,
            fakeCitizen.receive_emails,
            fakeCitizen.profilePicture,
            fakeCitizen.telegram_username
        );

        const report = await createReport(fakeBody, fakeCitizen.username, fakeFiles);

        expect(report.title).toBe(fakeBody.title);
        expect(report.photo1).toBe("/uploads/reports/img1.jpg");
    });

    it("throws NotFoundError when citizen is missing", async () => {
        await expect(
            createReport(fakeBody, "unknownUser", fakeFiles)
        ).rejects.toThrow(NotFoundError);
    });

    it("throws BadRequestError for missing required fields", async () => {
        await citizenRepo.createCitizen(
            fakeCitizen.email,
            fakeCitizen.username,
            fakeCitizen.name,
            fakeCitizen.surname,
            fakeCitizen.password,
            fakeCitizen.receive_emails,
            fakeCitizen.profilePicture,
            fakeCitizen.telegram_username
        );

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
            createReport(incomplete, fakeCitizen.username, fakeFiles)
        ).rejects.toThrow(BadRequestError);
    });

    it("throws BadRequestError when no photos are provided", async () => {
        await citizenRepo.createCitizen(
            fakeCitizen.email,
            fakeCitizen.username,
            fakeCitizen.name,
            fakeCitizen.surname,
            fakeCitizen.password,
            fakeCitizen.receive_emails,
            fakeCitizen.profilePicture,
            fakeCitizen.telegram_username
        );

        await expect(
            createReport(fakeBody, fakeCitizen.username, [])
        ).rejects.toThrow("At least one photo is required");
    });

    it("handles multiple photos correctly", async () => {
        await citizenRepo.createCitizen(
            fakeCitizen.email,
            fakeCitizen.username,
            fakeCitizen.name,
            fakeCitizen.surname,
            fakeCitizen.password,
            fakeCitizen.receive_emails,
            fakeCitizen.profilePicture,
            fakeCitizen.telegram_username
        );

        const files = [
            { filename: "img1.jpg" } as Express.Multer.File,
            { filename: "img2.jpg" } as Express.Multer.File,
            { filename: "img3.jpg" } as Express.Multer.File
        ];

        const report = await createReport(fakeBody, fakeCitizen.username, files);

        expect(report.photo1).toBe("/uploads/reports/img1.jpg");
        expect(report.photo2).toBe("/uploads/reports/img2.jpg");
        expect(report.photo3).toBe("/uploads/reports/img3.jpg");
    });

    it("sets photo2 and photo3 to undefined when only 1 photo is provided", async () => {
        await citizenRepo.createCitizen(
            fakeCitizen.email,
            fakeCitizen.username,
            fakeCitizen.name,
            fakeCitizen.surname,
            fakeCitizen.password,
            fakeCitizen.receive_emails,
            fakeCitizen.profilePicture,
            fakeCitizen.telegram_username
        );

        const files = [
            { filename: "one.jpg" } as Express.Multer.File
        ];

        const report = await createReport(fakeBody, fakeCitizen.username, files);

        expect(report.photo2).toBeNull();
        expect(report.photo3).toBeNull();
    });

    it("sets photo3 to undefined when exactly 2 photos are provided", async () => {
        await citizenRepo.createCitizen(
            fakeCitizen.email,
            fakeCitizen.username,
            fakeCitizen.name,
            fakeCitizen.surname,
            fakeCitizen.password,
            fakeCitizen.receive_emails,
            fakeCitizen.profilePicture,
            fakeCitizen.telegram_username
        );

        const files = [
            { filename: "p1.jpg" } as Express.Multer.File,
            { filename: "p2.jpg" } as Express.Multer.File
        ];

        const report = await createReport(fakeBody, fakeCitizen.username, files);

        expect(report.photo3).toBeNull();
    });

    it("parses anonymous = true (boolean)", async () => {
        await citizenRepo.createCitizen(
            fakeCitizen.email,
            fakeCitizen.username,
            fakeCitizen.name,
            fakeCitizen.surname,
            fakeCitizen.password,
            fakeCitizen.receive_emails,
            fakeCitizen.profilePicture,
            fakeCitizen.telegram_username
        );

        const report = await createReport(
            { ...fakeBody, anonymous: true },
            fakeCitizen.username,
            fakeFiles
        );

        expect(report.anonymous).toBe(true);
    });

    it("parses anonymous = 'false' correctly", async () => {
        await citizenRepo.createCitizen(
            fakeCitizen.email,
            fakeCitizen.username,
            fakeCitizen.name,
            fakeCitizen.surname,
            fakeCitizen.password,
            fakeCitizen.receive_emails,
            fakeCitizen.profilePicture,
            fakeCitizen.telegram_username
        );

        const report = await createReport(
            { ...fakeBody, anonymous: "false" },
            fakeCitizen.username,
            fakeFiles
        );

        expect(report.anonymous).toBe(false);
    });

    it("converts latitude and longitude to numbers", async () => {
        await citizenRepo.createCitizen(
            fakeCitizen.email,
            fakeCitizen.username,
            fakeCitizen.name,
            fakeCitizen.surname,
            fakeCitizen.password,
            fakeCitizen.receive_emails,
            fakeCitizen.profilePicture,
            fakeCitizen.telegram_username
        );

        const report = await createReport(fakeBody, fakeCitizen.username, fakeFiles);

        expect(typeof report.latitude).toBe("number");
        expect(typeof report.longitude).toBe("number");
    });

    describe("ReportController multer storage & fileFilter", () => {
        const uploadDir = "./uploads/reports";

        beforeEach(() => {
            if (fs.existsSync(uploadDir)) {
                fs.rmSync(uploadDir, { recursive: true, force: true });
            }
        });

        it("fileFilter accepts valid image files", (done) => {
            const file = { originalname: "image.jpg", mimetype: "image/jpeg" } as any;

            (uploadReportPictures as any).fileFilter({}, file, (err: any, ok: boolean) => {
                expect(err).toBeNull();
                expect(ok).toBe(true);
                done();
            });
        });

        it("fileFilter rejects invalid file types", (done) => {
            const file = { originalname: "file.exe", mimetype: "application/octet-stream" } as any;

            (uploadReportPictures as any).fileFilter({}, file, (err: any) => {
                expect(err).toBeInstanceOf(BadRequestError);
                expect(err.message).toContain("Only JPEG, JPG, and PNG images are allowed");
                done();
            });
        });
    });
});

describe("ReportController - Messages", () => {

    describe("addMessageToReport", () => {
        it("allows a citizen to add a message to their own report", async () => {
            await officeRepo.createOffice(fakeStaff.officeName, "Desc", OfficeCategory.RUFO);
            const citizen = await citizenRepo.createCitizen(fakeCitizen.email, fakeCitizen.username, fakeCitizen.name, fakeCitizen.surname, fakeCitizen.password, fakeCitizen.receive_emails, fakeCitizen.profilePicture, fakeCitizen.telegram_username);
            const report = await createReport(fakeBody, citizen.username, fakeFiles);

            const message = "This is a test message from the citizen.";
            await addMessageToReport(report.id, citizen.username, "CITIZEN", message);

            const messages = await reportRepo.getAllMessages(report.id);
            expect(messages).toHaveLength(1);
            expect(messages[0].message).toBe(message);
            expect(messages[0].staff).toBeNull();
        });

        it("allows assigned staff to add a message", async () => {
            await officeRepo.createOffice(fakeStaff.officeName, "Desc", OfficeCategory.RUFO);
            const citizen = await citizenRepo.createCitizen(fakeCitizen.email, fakeCitizen.username, fakeCitizen.name, fakeCitizen.surname, fakeCitizen.password, fakeCitizen.receive_emails, fakeCitizen.profilePicture, fakeCitizen.telegram_username);
            const staff = await staffRepo.createStaff(fakeStaff.username, fakeStaff.name, fakeStaff.surname, fakeStaff.password, fakeStaff.role, fakeStaff.officeName);
            const report = await createReport(fakeBody, citizen.username, fakeFiles);

            report.assignedStaff = staff;
            await TestDataSource.getRepository(ReportDAO).save(report);

            const message = "This is a reply from the assigned staff.";
            await addMessageToReport(report.id, staff.username, "STAFF", message);

            const messages = await reportRepo.getAllMessages(report.id);
            expect(messages).toHaveLength(1);
            expect(messages[0].message).toBe(message);
            expect(messages[0].staff?.username).toBe(staff.username);
        });

        it("throws BadRequestError if a citizen tries to comment on another's report", async () => {
            const citizen = await citizenRepo.createCitizen(fakeCitizen.email, fakeCitizen.username, fakeCitizen.name, fakeCitizen.surname, fakeCitizen.password, fakeCitizen.receive_emails, fakeCitizen.profilePicture, fakeCitizen.telegram_username);
            const report = await createReport(fakeBody, citizen.username, fakeFiles);

            await expect(
                addMessageToReport(report.id, "another_citizen", "CITIZEN", "Trying to comment")
            ).rejects.toThrow(BadRequestError);
        });

        it("throws BadRequestError if unassigned staff tries to comment", async () => {
            await officeRepo.createOffice(fakeStaff.officeName, "Desc", OfficeCategory.RUFO);
            const citizen = await citizenRepo.createCitizen(fakeCitizen.email, fakeCitizen.username, fakeCitizen.name, fakeCitizen.surname, fakeCitizen.password, fakeCitizen.receive_emails, fakeCitizen.profilePicture, fakeCitizen.telegram_username);
            await staffRepo.createStaff(fakeStaff.username, fakeStaff.name, fakeStaff.surname, fakeStaff.password, fakeStaff.role, fakeStaff.officeName);
            const report = await createReport(fakeBody, citizen.username, fakeFiles);

            await expect(
                addMessageToReport(report.id, fakeStaff.username, "STAFF", "I am not assigned")
            ).rejects.toThrow(BadRequestError);
        });

        it("throws NotFoundError for a non-existent report", async () => {
            const citizen = await citizenRepo.createCitizen(fakeCitizen.email, fakeCitizen.username, fakeCitizen.name, fakeCitizen.surname, fakeCitizen.password, fakeCitizen.receive_emails, fakeCitizen.profilePicture, fakeCitizen.telegram_username);

            await expect(
                addMessageToReport(999, citizen.username, "CITIZEN", "Will fail")
            ).rejects.toThrow(NotFoundError);
        });
    });

    describe("getAllMessages", () => {
        it("returns all messages for a given report", async () => {
            await officeRepo.createOffice(fakeStaff.officeName, "Desc", OfficeCategory.RUFO);
            const citizen = await citizenRepo.createCitizen(fakeCitizen.email, fakeCitizen.username, fakeCitizen.name, fakeCitizen.surname, fakeCitizen.password, fakeCitizen.receive_emails, fakeCitizen.profilePicture, fakeCitizen.telegram_username);
            const staff = await staffRepo.createStaff(fakeStaff.username, fakeStaff.name, fakeStaff.surname, fakeStaff.password, fakeStaff.role, fakeStaff.officeName);
            const report = await createReport(fakeBody, citizen.username, fakeFiles);

            await addMessageToReport(report.id, citizen.username, "CITIZEN", "First message");

            report.assignedStaff = staff;
            await TestDataSource.getRepository(ReportDAO).save(report);
            await addMessageToReport(report.id, staff.username, "STAFF", "Staff reply");

            const messages = await getAllMessages(report.id);

            expect(messages).toHaveLength(2);
            expect(messages[0].message).toBe("First message");
            expect(messages[1].message).toBe("Staff reply");
        });

        it("returns an empty array for a report with no messages", async () => {
            const citizen = await citizenRepo.createCitizen(fakeCitizen.email, fakeCitizen.username, fakeCitizen.name, fakeCitizen.surname, fakeCitizen.password, fakeCitizen.receive_emails, fakeCitizen.profilePicture, fakeCitizen.telegram_username);
            const report = await createReport(fakeBody, citizen.username, fakeFiles);

            const messages = await getAllMessages(report.id);
            expect(messages).toEqual([]);
        });

        it("throws NotFoundError when fetching messages for a non-existent report", async () => {
            await expect(getAllMessages(999)).rejects.toThrow(NotFoundError);
        });
    });
});
