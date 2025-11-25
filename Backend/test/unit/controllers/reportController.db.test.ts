import { createReport, uploadReportPictures } from "@controllers/reportController";
import { CitizenRepository } from "@repositories/citizenRepository";
import { ReportRepository } from "@repositories/reportRepository";
import { CitizenDAO } from "@dao/citizenDAO";
import { ReportDAO } from "@dao/reportDAO";
import { initializeTestDataSource, closeTestDataSource, TestDataSource } from "../../setup/test-datasource";
import { BadRequestError } from "@errors/BadRequestError";
import { NotFoundError } from "@errors/NotFoundError";
import fs from "fs";

let citizenRepo: CitizenRepository;
let reportRepo: ReportRepository;

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
});

afterAll(async () => {
    await closeTestDataSource();
});

beforeEach(async () => {
    await TestDataSource.getRepository(CitizenDAO).clear();
    await TestDataSource.getRepository(ReportDAO).clear();
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

    it("sets photo2 and photo3 to null when only 1 photo is provided", async () => {
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

    it("parses anonymous boolean correctly", async () => {
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
});

describe("ReportController - uploadReportPictures", () => {
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
