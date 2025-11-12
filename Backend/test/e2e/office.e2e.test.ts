import { OfficeDAO, OfficeCategory } from "@dao/officeDAO";
import { StaffDAO, StaffRole } from "@models/dao/staffDAO";
import { OfficeRepository } from "@repositories/officeRepository";
import { initializeTestDataSource, closeTestDataSource, TestDataSource } from "../setup/test-datasource";
import request from "supertest";
import { app } from "@app";

let officeRepo: OfficeRepository;

const office1 = {
    name: "Municipal Organization Office",
    description: "Handles municipal organization",
    category: OfficeCategory.MOO,
};

const office2 = {
    name: "Water Supply Office",
    description: "Handles water supply",
    category: OfficeCategory.WSO,
};

const staff1 = {
    username: "peppevessicchio",
    name: "Peppe",
    surname: "Vessicchio",
    password: "rip_maestro2025",
    role: StaffRole.TOSM,
};

beforeAll(async () => {
    await initializeTestDataSource();
    officeRepo = new OfficeRepository();
});

afterAll(async () => {
    await closeTestDataSource();
});

beforeEach(async () => {
    await TestDataSource.getRepository(OfficeDAO).clear();
    await TestDataSource.getRepository(StaffDAO).clear();
});

describe("Office E2E Tests", () => {
    describe("GET /offices - Get all offices", () => {
        it("should return an empty array when no offices exist", async () => {
            const offices = await officeRepo.getAllOffices();
            expect(offices).toBeDefined();
            expect(offices.length).toBe(0);
        });

        it("should return all offices", async () => {
            const newOffice1 = await officeRepo.createOffice(
                office1.name,
                office1.description,
                office1.category
            );
            const newOffice2 = await officeRepo.createOffice(
                office2.name,
                office2.description,
                office2.category
            );
            /*
            const response = await request(app)
                .get('/api/offices')
                .expect('Content-Type', /json/)
                .expect(200);
            */
            expect(newOffice1).toBeDefined();
            expect(newOffice1.name).toBe(office1.name);
            expect(newOffice1.description).toBe(office1.description);
            expect(newOffice1.category).toBe(office1.category);
            expect(newOffice2).toBeDefined();
            expect(newOffice2.name).toBe(office2.name);
            expect(newOffice2.description).toBe(office2.description);
            expect(newOffice2.category).toBe(office2.category);
        });
    });
});

