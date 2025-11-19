import { ReportRepository } from "@repositories/reportRepository";
import { CitizenRepository } from "@repositories/citizenRepository";
import { ReportDAO } from "@dao/reportDAO";
import { CitizenDAO } from "@dao/citizenDAO";
import { OfficeCategory } from "@dao/officeDAO";
import { initializeTestDataSource, closeTestDataSource, TestDataSource } from "../../setup/test-datasource";

let citizenRepo: CitizenRepository;
let reportRepo: ReportRepository;

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

beforeAll(async () => {
    await initializeTestDataSource();
    citizenRepo = new CitizenRepository();
    reportRepo = new ReportRepository();
});

afterAll(async () => {
    await closeTestDataSource();
});

beforeEach(async () => {
    await TestDataSource.getRepository(ReportDAO).clear();
    await TestDataSource.getRepository(CitizenDAO).clear();
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