import { OfficeCategory } from "@dao/officeDAO";
import { StaffRole } from "@models/dao/staffDAO";
import { OfficeRepository } from "@repositories/officeRepository";
import { initializeTestDataSource, closeTestDataSource } from "../setup/test-datasource";
import request from "supertest";
import { StaffRepository } from "@repositories/staffRepository";

import { app } from "@app";

let officeRepo: OfficeRepository;
let staffRepo: StaffRepository;
let authCookie: string;

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
    staffRepo = new StaffRepository();

    await officeRepo.createDefaultOfficesIfNotExist();
    await staffRepo.createDefaultAdminIfNotExists();

    const loginResponse = await request(app)
        .post('/api/v1/auth/login?type=STAFF')
        .send({
            username: "admin",
            password: "admin123",
        })
        .expect(200);

    authCookie = loginResponse.headers['set-cookie'][0]; 
});

afterAll(async () => {
    await closeTestDataSource();
});

describe("Office E2E Tests", () => {
    describe("GET /offices - Get all offices", () => {
        it("should return an empty array when no offices exist", async () => {
            const response = await request(app)
                .get('/api/v1/offices')
                .set('Cookie', authCookie)
                .expect(200);

            expect(response.body).toBeDefined();
            expect(Array.isArray(response.body)).toBe(true);
            expect(response.body.length).toBe(9);
        });
        
    });
});

