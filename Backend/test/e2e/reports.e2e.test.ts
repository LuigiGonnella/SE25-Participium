import request from "supertest";
import type { Response } from "supertest";
import { app } from "@app";
import { beforeAllE2e, afterAllE2e, TEST_CITIZENS } from "@test/e2e/lifecycle";
import { TestDataSource } from "../setup/test-datasource";
import { CitizenDAO } from "@dao/citizenDAO";
import { ReportDAO, Status } from "@dao/reportDAO";
import { StaffDAO, StaffRole } from "@dao/staffDAO";
import { OfficeDAO, OfficeCategory } from "@dao/officeDAO";
import { CitizenRepository } from "@repositories/citizenRepository";
import { ReportRepository } from "@repositories/reportRepository";
import { StaffRepository } from "@repositories/staffRepository";
import { OfficeRepository } from "@repositories/officeRepository";
import bcrypt from "bcrypt";

const getStatusKey = (status: Status): string => {
    const key = Object.keys(Status).find(
        (statusKey) => Status[statusKey as keyof typeof Status] === status
    );
    if (!key) {
        throw new Error(`Status key not found for value ${status}`);
    }
    return key;
};

const getCategoryKey = (category: OfficeCategory): string => {
    const key = Object.keys(OfficeCategory).find(
        (categoryKey) => OfficeCategory[categoryKey as keyof typeof OfficeCategory] === category
    );
    if (!key) {
        throw new Error(`Category key not found for value ${category}`);
    }
    return key;
};

const expectErrorResponse = (res: Response, expectedMessage?: string) => {
    expect(res.body).toHaveProperty("message");
    if (expectedMessage) {
        expect(res.body.message).toBe(expectedMessage);
    }
};

describe("Reports API E2E Tests", () => {
    let citizenRepo: CitizenRepository;
    let reportRepo: ReportRepository;
    let staffRepo: StaffRepository;
    let officeRepo: OfficeRepository;
    let mproCookie: string;
    let tosmCookie: string;
    let staffCookie: string;
    let testCitizen1: CitizenDAO;
    let testCitizen2: CitizenDAO;
    let testOffice: OfficeDAO;
    let testMpro: StaffDAO;
    let testTosm: StaffDAO;
    let testReport1: ReportDAO;
    let testReport2: ReportDAO;
    let testReport3: ReportDAO;

    beforeAll(async () => {
        await beforeAllE2e();
        citizenRepo = new CitizenRepository();
        reportRepo = new ReportRepository();
        staffRepo = new StaffRepository();
        officeRepo = new OfficeRepository();

        // Create default offices
        await officeRepo.createDefaultOfficesIfNotExist();
        await staffRepo.createDefaultAdminIfNotExists();

        // Get test citizens
        testCitizen1 = await TestDataSource
            .getRepository(CitizenDAO)
            .findOneBy({ email: TEST_CITIZENS.citizen1.email }) || 
            await citizenRepo.createCitizen(
                TEST_CITIZENS.citizen1.email,
                TEST_CITIZENS.citizen1.username,
                TEST_CITIZENS.citizen1.name,
                TEST_CITIZENS.citizen1.surname,
                await bcrypt.hash(TEST_CITIZENS.citizen1.password, 10),
                TEST_CITIZENS.citizen1.receive_emails,
                TEST_CITIZENS.citizen1.profilePicture,
                TEST_CITIZENS.citizen1.telegram_username
            );

        testCitizen2 = await TestDataSource
            .getRepository(CitizenDAO)
            .findOneBy({ email: TEST_CITIZENS.citizen2.email }) ||
            await citizenRepo.createCitizen(
                TEST_CITIZENS.citizen2.email,
                TEST_CITIZENS.citizen2.username,
                TEST_CITIZENS.citizen2.name,
                TEST_CITIZENS.citizen2.surname,
                await bcrypt.hash(TEST_CITIZENS.citizen2.password, 10),
                TEST_CITIZENS.citizen2.receive_emails,
                TEST_CITIZENS.citizen2.profilePicture || undefined,
                TEST_CITIZENS.citizen2.telegram_username || undefined
            );

        // Get office (should exist after createDefaultOfficesIfNotExist)
        const officeByCategory = await officeRepo.getOfficeByCategory(OfficeCategory.RSTLO);
        if (!officeByCategory) {
            throw new Error("RSTLO office not found after creating default offices");
        }
        testOffice = officeByCategory;

        // Create MPRO staff
        const mproPassword = await bcrypt.hash("mpro123", 10);
        testMpro = await staffRepo.getStaffByUsername("test_mpro") ||
            await staffRepo.createStaff(
                "test_mpro",
                "Test",
                "MPRO",
                mproPassword,
                StaffRole.MPRO,
                testOffice.name
            );

        // Create TOSM staff
        const tosmPassword = await bcrypt.hash("tosm123", 10);
        testTosm = await staffRepo.getStaffByUsername("test_tosm") ||
            await staffRepo.createStaff(
                "test_tosm",
                "Test",
                "TOSM",
                tosmPassword,
                StaffRole.TOSM,
                testOffice.name
            );

        // Login as MPRO
        const mproLoginResponse = await request(app)
            .post('/api/v1/auth/login?type=STAFF')
            .send({
                username: "test_mpro",
                password: "mpro123",
            })
            .expect(200);
        mproCookie = mproLoginResponse.headers['set-cookie'][0];

        // Login as TOSM
        const tosmLoginResponse = await request(app)
            .post('/api/v1/auth/login?type=STAFF')
            .send({
                username: "test_tosm",
                password: "tosm123",
            })
            .expect(200);
        tosmCookie = tosmLoginResponse.headers['set-cookie'][0];

        // Login as admin (for general staff access)
        const staffLoginResponse = await request(app)
            .post('/api/v1/auth/login?type=STAFF')
            .send({
                username: "admin",
                password: "admin123",
            })
            .expect(200);
        staffCookie = staffLoginResponse.headers['set-cookie'][0];
    });

    afterAll(async () => {
        await afterAllE2e();
    });

    beforeEach(async () => {
        // Clear reports before each test
        await TestDataSource.getRepository(ReportDAO).clear();

        // Create test reports
        testReport1 = await reportRepo.create(
            testCitizen1,
            "Broken Traffic Light",
            "Traffic light at Main Street is not working",
            OfficeCategory.RSTLO,
            45.07,
            7.68,
            false,
            "/uploads/reports/test1.jpg"
        );

        testReport2 = await reportRepo.create(
            testCitizen2,
            "Pothole on Road",
            "Large pothole on Highway 101",
            OfficeCategory.RUFO,
            45.08,
            7.69,
            false,
            "/uploads/reports/test2.jpg",
            "/uploads/reports/test2b.jpg"
        );

        testReport3 = await reportRepo.create(
            testCitizen1,
            "Damaged Street Sign",
            "Stop sign is bent and unreadable",
            OfficeCategory.RSTLO,
            45.09,
            7.70,
            true,
            "/uploads/reports/test3.jpg"
        );
    });

    describe("GET /api/v1/reports - Get all reports", () => {
        it("should return all reports when no filters are provided", async () => {
            const res = await request(app)
                .get("/api/v1/reports")
                .set('Cookie', staffCookie)
                .expect(200);

            expect(res.body).toBeDefined();
            expect(Array.isArray(res.body)).toBe(true);
            expect(res.body.length).toBe(3);
        });

        it("should filter reports by citizen_username", async () => {
            const res = await request(app)
                .get(`/api/v1/reports?citizen_username=${TEST_CITIZENS.citizen1.username}`)
                .set('Cookie', staffCookie)
                .expect(200);

            const expectedIds = [testReport1.id, testReport3.id].sort((a: number, b: number) => a - b);
            const responseIds = res.body
                .map((r: any) => r.id as number)
                .sort((a: number, b: number) => a - b);
            expect(res.body).toHaveLength(expectedIds.length);
            expect(responseIds).toEqual(expectedIds);
            res.body.forEach((report: any) => {
                if (report.id === testReport3.id) {
                    expect(report.citizenUsername).toBeUndefined();
                } else {
                    expect(report.citizenUsername).toBe(TEST_CITIZENS.citizen1.username);
                }
            });
        });

        it("should filter reports by status", async () => {
            // Update one report to ASSIGNED status
            await TestDataSource.getRepository(ReportDAO).update(
                { id: testReport1.id },
                { status: Status.ASSIGNED }
            );

            const res = await request(app)
                .get(`/api/v1/reports?status=${getStatusKey(Status.ASSIGNED)}`)
                .set('Cookie', staffCookie)
                .expect(200);

            expect(res.body.length).toBeGreaterThanOrEqual(1);
            expect(res.body.every((r: any) => r.status === Status.ASSIGNED)).toBe(true);
        });

        it("should filter reports by title", async () => {
            const res = await request(app)
                .get(`/api/v1/reports?title=Broken_Traffic_Light`)
                .set('Cookie', staffCookie)
                .expect(200);

            expect(res.body).toHaveLength(1);
            expect(res.body[0].title).toBe("Broken Traffic Light");
        });

        it("should filter reports by category", async () => {
            const res = await request(app)
                .get(`/api/v1/reports?category=${getCategoryKey(OfficeCategory.RSTLO)}`)
                .set('Cookie', staffCookie)
                .expect(200);

            expect(res.body.length).toBeGreaterThanOrEqual(2);
            expect(res.body.every((r: any) => r.category === OfficeCategory.RSTLO)).toBe(true);
        });

        it("should filter reports by date range", async () => {
            const today = new Date();
            const tomorrow = new Date(today);
            tomorrow.setDate(tomorrow.getDate() + 1);
            const yesterday = new Date(today);
            yesterday.setDate(yesterday.getDate() - 1);

            const res = await request(app)
                .get(`/api/v1/reports?fromDate=${yesterday.toISOString()}&toDate=${tomorrow.toISOString()}`)
                .set('Cookie', staffCookie)
                .expect(200);

            expect(res.body.length).toBeGreaterThanOrEqual(0);
        });

        it("should return 400 when only fromDate is provided", async () => {
            const yesterday = new Date();
            yesterday.setDate(yesterday.getDate() - 1);

            const res = await request(app)
                .get(`/api/v1/reports?fromDate=${yesterday.toISOString()}`)
                .set('Cookie', staffCookie)
                .expect(400);

            expectErrorResponse(res);
        });

        it("should return 400 when only toDate is provided", async () => {
            const tomorrow = new Date();
            tomorrow.setDate(tomorrow.getDate() + 1);

            const res = await request(app)
                .get(`/api/v1/reports?toDate=${tomorrow.toISOString()}`)
                .set('Cookie', staffCookie)
                .expect(400);

            expectErrorResponse(res);
        });

        it("should return 400 when fromDate is after toDate", async () => {
            const today = new Date();
            const tomorrow = new Date(today);
            tomorrow.setDate(tomorrow.getDate() + 1);
            const dayAfter = new Date(tomorrow);
            dayAfter.setDate(dayAfter.getDate() + 1);

            const res = await request(app)
                .get(`/api/v1/reports?fromDate=${dayAfter.toISOString()}&toDate=${tomorrow.toISOString()}`)
                .set('Cookie', staffCookie)
                .expect(400);

            expectErrorResponse(res);
        });

        it("should return 400 for invalid status", async () => {
            const res = await request(app)
                .get("/api/v1/reports?status=INVALID_STATUS")
                .set('Cookie', staffCookie)
                .expect(400);

            expectErrorResponse(res);
        });

        it("should return 400 for invalid category", async () => {
            const res = await request(app)
                .get("/api/v1/reports?category=INVALID_CATEGORY")
                .set('Cookie', staffCookie)
                .expect(400);

            expectErrorResponse(res);
        });

        it("should return empty array when no reports match filters", async () => {
            const res = await request(app)
                .get("/api/v1/reports?citizen_username=nonexistent")
                .set('Cookie', staffCookie)
                .expect(200);

            expect(res.body).toEqual([]);
        });

        it("should require authentication", async () => {
            const res = await request(app)
                .get("/api/v1/reports")
                .expect(401);

            expect(res.status).toBe(401);
        });
    });

    describe("GET /api/v1/reports/:reportId - Get report by ID", () => {
        it("should return report by valid ID", async () => {
            const res = await request(app)
                .get(`/api/v1/reports/${testReport1.id}`)
                .set('Cookie', staffCookie)
                .expect(200);

            expect(res.body).toBeDefined();
            expect(res.body.id).toBe(testReport1.id);
            expect(res.body.title).toBe("Broken Traffic Light");
            expect(res.body.description).toBe("Traffic light at Main Street is not working");
            expect(res.body.category).toBe(OfficeCategory.RSTLO);
            expect(res.body.status).toBe(Status.PENDING);
            expect(res.body).toHaveProperty('coordinates');
            expect(res.body).toHaveProperty('photos');
        });

        it("should return 404 for non-existent report ID", async () => {
            const res = await request(app)
                .get("/api/v1/reports/9999")
                .set('Cookie', staffCookie)
                .expect(404);

            expectErrorResponse(res);
        });

        it("should return 400 for invalid report ID format", async () => {
            const res = await request(app)
                .get("/api/v1/reports/invalid")
                .set('Cookie', staffCookie)
                .expect(400);

            expectErrorResponse(res);
        });

        it("should return report with all expected fields", async () => {
            const res = await request(app)
                .get(`/api/v1/reports/${testReport2.id}`)
                .set('Cookie', staffCookie)
                .expect(200);

            expect(res.body).toHaveProperty('id');
            expect(res.body).toHaveProperty('title');
            expect(res.body).toHaveProperty('description');
            expect(res.body).toHaveProperty('status');
            expect(res.body).toHaveProperty('category');
            expect(res.body).toHaveProperty('coordinates');
            expect(res.body).toHaveProperty('photos');
            expect(res.body).toHaveProperty('citizenUsername');
            expect(res.body).toHaveProperty('timestamp');
        });

        it("should return report with multiple photos", async () => {
            const res = await request(app)
                .get(`/api/v1/reports/${testReport2.id}`)
                .set('Cookie', staffCookie)
                .expect(200);

            expect(res.body.photos).toBeDefined();
            expect(Array.isArray(res.body.photos)).toBe(true);
            expect(res.body.photos.length).toBeGreaterThanOrEqual(1);
        });

        it("should require authentication", async () => {
            const res = await request(app)
                .get(`/api/v1/reports/${testReport1.id}`)
                .expect(401);

            expect(res.status).toBe(401);
        });
    });

    describe("PATCH /api/v1/reports/:reportId/manage - Update report as MPRO", () => {
        it("should update report status to ASSIGNED", async () => {
            const res = await request(app)
                .patch(`/api/v1/reports/${testReport1.id}/manage`)
                .set('Cookie', mproCookie)
                .send({
                    status: getStatusKey(Status.ASSIGNED)
                })
                .expect(200);

            expect(res.body.status).toBe(Status.ASSIGNED);
            expect(res.body.id).toBe(testReport1.id);
        });

        it("should update report status to REJECTED with comment", async () => {
            const res = await request(app)
                .patch(`/api/v1/reports/${testReport2.id}/manage`)
                .set('Cookie', mproCookie)
                .send({
                    status: getStatusKey(Status.REJECTED),
                    comment: "Report does not meet requirements"
                })
                .expect(200);

            expect(res.body.status).toBe(Status.REJECTED);
            expect(res.body.comment).toBe("Report does not meet requirements");
        });

        it("should update report status and category", async () => {
            const res = await request(app)
                .patch(`/api/v1/reports/${testReport1.id}/manage`)
                .set('Cookie', mproCookie)
                .send({
                    status: getStatusKey(Status.ASSIGNED),
                    category: getCategoryKey(OfficeCategory.PLO)
                })
                .expect(200);

            expect(res.body.status).toBe(Status.ASSIGNED);
            expect(res.body.category).toBe(OfficeCategory.PLO);
        });

        it("should return 400 when status is missing", async () => {
            const res = await request(app)
                .patch(`/api/v1/reports/${testReport1.id}/manage`)
                .set('Cookie', mproCookie)
                .send({
                    category: getCategoryKey(OfficeCategory.PLO)
                })
                .expect(400);

            expectErrorResponse(res);
        });

        it("should return 400 when rejecting without comment", async () => {
            const res = await request(app)
                .patch(`/api/v1/reports/${testReport1.id}/manage`)
                .set('Cookie', mproCookie)
                .send({
                    status: getStatusKey(Status.REJECTED)
                })
                .expect(400);

            expectErrorResponse(res);
        });

        it("should return 400 when adding comment to non-rejected status", async () => {
            const res = await request(app)
                .patch(`/api/v1/reports/${testReport1.id}/manage`)
                .set('Cookie', mproCookie)
                .send({
                    status: getStatusKey(Status.ASSIGNED),
                    comment: "This should not be allowed"
                })
                .expect(400);

            expectErrorResponse(res);
        });

        it("should return 400 for invalid status for MPRO", async () => {
            const res = await request(app)
                .patch(`/api/v1/reports/${testReport1.id}/manage`)
                .set('Cookie', mproCookie)
                .send({
                    status: getStatusKey(Status.IN_PROGRESS)
                })
                .expect(400);

            expectErrorResponse(res);
        });

        it("should return 400 for invalid status value", async () => {
            const res = await request(app)
                .patch(`/api/v1/reports/${testReport1.id}/manage`)
                .set('Cookie', mproCookie)
                .send({
                    status: "INVALID_STATUS"
                })
                .expect(400);

            expectErrorResponse(res);
        });

        it("should return 400 for invalid category", async () => {
            const res = await request(app)
                .patch(`/api/v1/reports/${testReport1.id}/manage`)
                .set('Cookie', mproCookie)
                .send({
                    status: getStatusKey(Status.ASSIGNED),
                    category: "INVALID_CATEGORY"
                })
                .expect(400);

            expectErrorResponse(res);
        });

        it("should return 400 for invalid report ID", async () => {
            const res = await request(app)
                .patch("/api/v1/reports/invalid/manage")
                .set('Cookie', mproCookie)
                .send({
                    status: getStatusKey(Status.ASSIGNED)
                })
                .expect(400);

            expectErrorResponse(res);
        });

        it("should return 404 for non-existent report", async () => {
            const res = await request(app)
                .patch("/api/v1/reports/9999/manage")
                .set('Cookie', mproCookie)
                .send({
                    status: getStatusKey(Status.ASSIGNED)
                })
                .expect(404);

            expectErrorResponse(res);
        });

        it("should require MPRO authentication", async () => {
            const res = await request(app)
                .patch(`/api/v1/reports/${testReport1.id}/manage`)
                .send({
                    status: getStatusKey(Status.ASSIGNED)
                })
                .expect(401);

            expect(res.status).toBe(401);
        });

        it("should not allow TOSM to access MPRO endpoint", async () => {
            const res = await request(app)
                .patch(`/api/v1/reports/${testReport1.id}/manage`)
                .set('Cookie', tosmCookie)
                .send({
                    status: getStatusKey(Status.ASSIGNED)
                })
                .expect(403);

            expect(res.status).toBe(403);
        });
    });

    describe("PATCH /api/v1/reports/:reportId/work - Update report as TOSM", () => {
        beforeEach(async () => {
            // Set reports to ASSIGNED status for TOSM tests
            await TestDataSource.getRepository(ReportDAO).update(
                { id: testReport1.id },
                { status: Status.ASSIGNED }
            );
            await TestDataSource.getRepository(ReportDAO).update(
                { id: testReport2.id },
                { status: Status.ASSIGNED }
            );
        });

        it("should update report status to IN_PROGRESS", async () => {
            const res = await request(app)
                .patch(`/api/v1/reports/${testReport1.id}/work`)
                .set('Cookie', tosmCookie)
                .send({
                    status: getStatusKey(Status.IN_PROGRESS)
                })
                .expect(200);

            expect(res.body.status).toBe(Status.IN_PROGRESS);
            expect(res.body.id).toBe(testReport1.id);
        });

        it("should update report status to SUSPENDED", async () => {
            // First set to IN_PROGRESS
            await TestDataSource.getRepository(ReportDAO).update(
                { id: testReport1.id },
                { status: Status.IN_PROGRESS }
            );

            const res = await request(app)
                .patch(`/api/v1/reports/${testReport1.id}/work`)
                .set('Cookie', tosmCookie)
                .send({
                    status: getStatusKey(Status.SUSPENDED)
                })
                .expect(200);

            expect(res.body.status).toBe(Status.SUSPENDED);
        });

        it("should update report status to RESOLVED with comment", async () => {
            // First set to IN_PROGRESS
            await TestDataSource.getRepository(ReportDAO).update(
                { id: testReport1.id },
                { status: Status.IN_PROGRESS }
            );

            const res = await request(app)
                .patch(`/api/v1/reports/${testReport1.id}/work`)
                .set('Cookie', tosmCookie)
                .send({
                    status: getStatusKey(Status.RESOLVED),
                    comment: "Issue has been fixed"
                })
                .expect(200);

            expect(res.body.status).toBe(Status.RESOLVED);
            expect(res.body.comment).toBe("Issue has been fixed");
        });

        it("should return 400 when status is missing", async () => {
            const res = await request(app)
                .patch(`/api/v1/reports/${testReport1.id}/work`)
                .set('Cookie', tosmCookie)
                .send({})
                .expect(400);

            expectErrorResponse(res);
        });

        it("should return 400 when adding comment to non-resolved status", async () => {
            const res = await request(app)
                .patch(`/api/v1/reports/${testReport1.id}/work`)
                .set('Cookie', tosmCookie)
                .send({
                    status: getStatusKey(Status.IN_PROGRESS),
                    comment: "This should not be allowed"
                })
                .expect(400);

            expectErrorResponse(res);
        });

        it("should return 400 when trying to assign to another staff", async () => {
            const res = await request(app)
                .patch(`/api/v1/reports/${testReport1.id}/work`)
                .set('Cookie', tosmCookie)
                .send({
                    status: getStatusKey(Status.IN_PROGRESS),
                    staff: "another_staff"
                })
                .expect(400);

            expectErrorResponse(res);
        });

        it("should return 400 for invalid status for TOSM", async () => {
            const res = await request(app)
                .patch(`/api/v1/reports/${testReport1.id}/work`)
                .set('Cookie', tosmCookie)
                .send({
                    status: getStatusKey(Status.PENDING)
                })
                .expect(400);

            expectErrorResponse(res);
        });

        it("should return 400 for invalid status value", async () => {
            const res = await request(app)
                .patch(`/api/v1/reports/${testReport1.id}/work`)
                .set('Cookie', tosmCookie)
                .send({
                    status: "INVALID_STATUS"
                })
                .expect(400);

            expectErrorResponse(res);
        });

        it("should return 400 for invalid report ID", async () => {
            const res = await request(app)
                .patch("/api/v1/reports/invalid/work")
                .set('Cookie', tosmCookie)
                .send({
                    status: getStatusKey(Status.IN_PROGRESS)
                })
                .expect(400);

            expectErrorResponse(res);
        });

        it("should return 404 for non-existent report", async () => {
            const res = await request(app)
                .patch("/api/v1/reports/9999/work")
                .set('Cookie', tosmCookie)
                .send({
                    status: getStatusKey(Status.IN_PROGRESS)
                })
                .expect(404);

            expectErrorResponse(res);
        });

        it("should require TOSM authentication", async () => {
            const res = await request(app)
                .patch(`/api/v1/reports/${testReport1.id}/work`)
                .send({
                    status: getStatusKey(Status.IN_PROGRESS)
                })
                .expect(401);

            expect(res.status).toBe(401);
        });

        it("should not allow MPRO to access TOSM endpoint", async () => {
            const res = await request(app)
                .patch(`/api/v1/reports/${testReport1.id}/work`)
                .set('Cookie', mproCookie)
                .send({
                    status: getStatusKey(Status.IN_PROGRESS)
                })
                .expect(403);

            expect(res.status).toBe(403);
        });
    });
});

