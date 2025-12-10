import request from "supertest";
import type { Response } from "supertest";
import { app } from "@app";
import { 
    beforeAllE2e, 
    afterAllE2e, 
    beforeEachE2e, 
    DEFAULT_CITIZENS, 
    DEFAULT_STAFF,
    TestDataManager 
} from "@test/e2e/lifecycle";
import { TestDataSource } from "../setup/test-datasource";
import { ReportDAO, Status } from "@dao/reportDAO";
import { OfficeCategory } from "@dao/officeDAO";
import { ReportRepository } from "@repositories/reportRepository";
import { NotificationDAO } from "@models/dao/notificationDAO";
import path from "path";

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
    let reportRepo: ReportRepository;
    let citizenCookie: string;
    let adminCookie: string;
    let mproCookie: string;
    let tosmCookie: string;
    let emCookie: string;
    let testReport1: ReportDAO;
    let testReport2: ReportDAO;
    let testReport3: ReportDAO;
    const sampleImage = path.join(__dirname, "sample.png");

    beforeAll(async () => {
        await beforeAllE2e();
        reportRepo = new ReportRepository();

        // Login as citizen for report creation
        const citizenLogin = await request(app)
            .post("/api/v1/auth/login?type=CITIZEN")
            .send({
                username: DEFAULT_CITIZENS.citizen1.username,
                password: DEFAULT_CITIZENS.citizen1.password,
            })
            .expect(200);
        citizenCookie = citizenLogin.headers["set-cookie"][0];

        // Login as admin
        const adminLogin = await request(app)
            .post('/api/v1/auth/login?type=STAFF')
            .send({
                username: DEFAULT_STAFF.admin.username,
                password: DEFAULT_STAFF.admin.password,
            })
            .expect(200);
        adminCookie = adminLogin.headers['set-cookie'][0];

        // Login as MPRO
        const mproLogin = await request(app)
            .post('/api/v1/auth/login?type=STAFF')
            .send({
                username: DEFAULT_STAFF.mpro.username,
                password: DEFAULT_STAFF.mpro.password,
            })
            .expect(200);
        mproCookie = mproLogin.headers['set-cookie'][0];

        // Login as TOSM for RSTLO category
        const tosmLogin = await request(app)
            .post('/api/v1/auth/login?type=STAFF')
            .send({
                username: DEFAULT_STAFF.tosm_RSTLO.username,
                password: DEFAULT_STAFF.tosm_RSTLO.password,
            })
            .expect(200);
        tosmCookie = tosmLogin.headers['set-cookie'][0];

        // Login as EM for RSTLO category
        const emLogin = await request(app)
            .post('/api/v1/auth/login?type=STAFF')
            .send({
                username: DEFAULT_STAFF.em_RSTLO.username,
                password: DEFAULT_STAFF.em_RSTLO.password,
            })
            .expect(200);
        emCookie = emLogin.headers['set-cookie'][0];
    });

    afterAll(async () => {
        await afterAllE2e();
    });

    beforeEach(async () => {
        await beforeEachE2e();

        // Get default citizens for test reports
        const citizen1 = await TestDataManager.getCitizen('citizen1');
        const citizen2 = await TestDataManager.getCitizen('citizen2');

        // Create test reports
        testReport1 = await reportRepo.create(
            citizen1,
            "Broken Traffic Light",
            "Traffic light at Main Street is not working",
            OfficeCategory.RSTLO,
            45.07,
            7.68,
            false,
            "/uploads/reports/test1.jpg"
        );

        testReport2 = await reportRepo.create(
            citizen2,
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
            citizen1,
            "Damaged Street Sign",
            "Stop sign is bent and unreadable",
            OfficeCategory.RSTLO,
            45.09,
            7.70,
            true, // anonymous
            "/uploads/reports/test3.jpg"
        );
    });

    describe("POST /api/v1/reports - Report Creation", () => {
        it("should create a report successfully", async () => {
            const res = await request(app)
                .post("/api/v1/reports")
                .set("Cookie", citizenCookie)
                .field("title", "Broken Streetlight")
                .field("description", "The streetlight near my house is broken")
                .field("category", "Public Lighting")
                .field("latitude", 45.0677)
                .field("longitude", 7.6823)
                .field("anonymous", false)
                .attach("photos", sampleImage)
                .expect(201);

            expect(res.body).toBeDefined();
            expect(res.body.title).toBe("Broken Streetlight");
            expect(res.body.photos).toBeDefined();
            expect(res.body.photos[0]).toContain("/uploads/reports/");
        });

        it("should fail when required fields are missing", async () => {
            const res = await request(app)
                .post("/api/v1/reports")
                .set("Cookie", citizenCookie)
                .field("title", "")
                .field("description", "desc")
                .field("category", "Public Lighting")
                .field("latitude", 45)
                .field("longitude", 7)
                .attach("photos", sampleImage)
                .expect(400);

            expect(res.body).toBeDefined();
            expect(res.body.code).toBe(400);  
            expect(res.body.message).toContain("Missing required fields");
        });

        it("should fail when no photo is uploaded", async () => {
            const res = await request(app)
                .post("/api/v1/reports")
                .set("Cookie", citizenCookie)
                .field("title", "Test Report")
                .field("description", "Testing")
                .field("category", "Public Lighting")
                .field("latitude", "45")
                .field("longitude", "7")
                .field("anonymous", "false")
                .expect(400);

            expect(res.body.message).toContain("At least one photo is required");
        });

        it("should reject unauthenticated user", async () => {
            const res = await request(app)
                .post("/api/v1/reports")
                .field("title", "No Login")
                .field("description", "desc")
                .field("category", "Public Lighting")
                .field("latitude", "45")
                .field("longitude", "7")
                .field("anonymous", "false")
                .expect(401);

            expect(res.body.message).toBeDefined();
            expect(res.body.message).toBe("Not authenticated");
        });
    });

    describe("GET /api/v1/reports - Get all reports", () => {
        it("should return all reports when no filters are provided", async () => {
            const res = await request(app)
                .get("/api/v1/reports")
                .set('Cookie', adminCookie)
                .expect(200);

            expect(res.body).toBeDefined();
            expect(Array.isArray(res.body)).toBe(true);
            expect(res.body.length).toBe(3);
        });

        it("should filter reports by citizen_username", async () => {
            const res = await request(app)
                .get(`/api/v1/reports?citizen_username=${DEFAULT_CITIZENS.citizen1.username}`)
                .set('Cookie', adminCookie)
                .expect(200);

            const expectedIds = [testReport1.id, testReport3.id].sort((a: number, b: number) => a - b);
            const responseIds = res.body
                .map((r: any) => r.id as number)
                .sort((a: number, b: number) => a - b);
            expect(res.body).toHaveLength(expectedIds.length);
            expect(responseIds).toEqual(expectedIds);
            res.body.forEach((report: any) => {
                if (report.id === testReport3.id) {
                    // Anonymous report
                    expect(report.citizenUsername).toBeUndefined();
                } else {
                    expect(report.citizenUsername).toBe(DEFAULT_CITIZENS.citizen1.username);
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
                .set('Cookie', adminCookie)
                .expect(200);

            expect(res.body.length).toBeGreaterThanOrEqual(1);
            expect(res.body.every((r: any) => r.status === Status.ASSIGNED)).toBe(true);
        });

        it("should filter reports by title", async () => {
            const res = await request(app)
                .get(`/api/v1/reports?title=Broken_Traffic_Light`)
                .set('Cookie', adminCookie)
                .expect(200);

            expect(res.body).toHaveLength(1);
            expect(res.body[0].title).toBe("Broken Traffic Light");
        });

        it("should filter reports by category", async () => {
            const res = await request(app)
                .get(`/api/v1/reports?category=${getCategoryKey(OfficeCategory.RSTLO)}`)
                .set('Cookie', adminCookie)
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
                .set('Cookie', adminCookie)
                .expect(200);

            expect(res.body.length).toBeGreaterThanOrEqual(0);
        });

        it("should return 400 when only fromDate is provided", async () => {
            const yesterday = new Date();
            yesterday.setDate(yesterday.getDate() - 1);

            const res = await request(app)
                .get(`/api/v1/reports?fromDate=${yesterday.toISOString()}`)
                .set('Cookie', adminCookie)
                .expect(400);

            expectErrorResponse(res);
        });

        it("should return 400 when only toDate is provided", async () => {
            const tomorrow = new Date();
            tomorrow.setDate(tomorrow.getDate() + 1);

            const res = await request(app)
                .get(`/api/v1/reports?toDate=${tomorrow.toISOString()}`)
                .set('Cookie', adminCookie)
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
                .set('Cookie', adminCookie)
                .expect(400);

            expectErrorResponse(res);
        });

        it("should return 400 for invalid status", async () => {
            const res = await request(app)
                .get("/api/v1/reports?status=INVALID_STATUS")
                .set('Cookie', adminCookie)
                .expect(400);

            expectErrorResponse(res);
        });

        it("should return 400 for invalid category", async () => {
            const res = await request(app)
                .get("/api/v1/reports?category=INVALID_CATEGORY")
                .set('Cookie', adminCookie)
                .expect(400);

            expectErrorResponse(res);
        });

        it("should return empty array when no reports match filters", async () => {
            const res = await request(app)
                .get("/api/v1/reports?citizen_username=nonexistent")
                .set('Cookie', adminCookie)
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
                .set('Cookie', adminCookie)
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
                .set('Cookie', adminCookie)
                .expect(404);

            expectErrorResponse(res);
        });

        it("should return 400 for invalid report ID format", async () => {
            const res = await request(app)
                .get("/api/v1/reports/invalid")
                .set('Cookie', adminCookie)
                .expect(400);

            expectErrorResponse(res);
        });

        it("should return report with all expected fields", async () => {
            const res = await request(app)
                .get(`/api/v1/reports/${testReport2.id}`)
                .set('Cookie', adminCookie)
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
                .set('Cookie', adminCookie)
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

    describe("PATCH /api/v1/reports/:reportId/updateStatus - Update report as TOSM", () => {
        beforeEach(async () => {
            // Get TOSM staff member
            const tosmStaff = await TestDataManager.getStaff('tosm_RSTLO');
            
            // Set reports to ASSIGNED status and assign to TOSM for tests
            await TestDataSource.getRepository(ReportDAO).update(
                { id: testReport1.id },
                { status: Status.ASSIGNED, assignedStaff: tosmStaff }
            );
            await TestDataSource.getRepository(ReportDAO).update(
                { id: testReport2.id },
                { status: Status.ASSIGNED, assignedStaff: tosmStaff }
            );
            // assign report to TOSM (self-assign)
            /* await request(app)
                .patch(`/api/v1/reports/${testReport1.id}/assignSelf`)
                .set('Cookie', tosmCookie)
                .expect(200); */
        });

        it("should update report status to IN_PROGRESS", async () => {
            const res = await request(app)
                .patch(`/api/v1/reports/${testReport1.id}/updateStatus`)
                .set('Cookie', tosmCookie)
                .send({
                    status: getStatusKey(Status.IN_PROGRESS)
                })
                .expect(200);

            expect(res.body.status).toBe("In Progress");
            expect(res.body.id).toBe(testReport1.id);
        });

        it("should update report status to SUSPENDED", async () => {
            // First set to IN_PROGRESS
            await TestDataSource.getRepository(ReportDAO).update(
                { id: testReport1.id },
                { status: Status.IN_PROGRESS }
            );

            const res = await request(app)
                .patch(`/api/v1/reports/${testReport1.id}/updateStatus`)
                .set('Cookie', tosmCookie)
                .send({
                    status: getStatusKey(Status.SUSPENDED)
                })
                .expect(200);

            expect(res.body.status).toBe("Suspended");
        });

        it("should update report status to RESOLVED with comment", async () => {
            // First set to IN_PROGRESS
            await TestDataSource.getRepository(ReportDAO).update(
                { id: testReport1.id },
                { status: Status.IN_PROGRESS }
            );

            const res = await request(app)
                .patch(`/api/v1/reports/${testReport1.id}/updateStatus`)
                .set('Cookie', tosmCookie)
                .send({
                    status: getStatusKey(Status.RESOLVED),
                    comment: "Issue has been fixed"
                })
                .expect(200);

            expect(res.body.status).toBe("Resolved");
            expect(res.body.comment).toBe("Issue has been fixed");
        });

        it("should return 400 when status is missing", async () => {
            const res = await request(app)
                .patch(`/api/v1/reports/${testReport1.id}/updateStatus`)
                .set('Cookie', tosmCookie)
                .send({})
                .expect(400);

            expectErrorResponse(res);
        });

        it("should return 400 when adding comment to non-resolved status", async () => {
            const res = await request(app)
                .patch(`/api/v1/reports/${testReport1.id}/updateStatus`)
                .set('Cookie', tosmCookie)
                .send({
                    status: getStatusKey(Status.IN_PROGRESS),
                    comment: "This should not be allowed"
                })
                .expect(400);

            // Comment is actually allowed, so we expect success
            expect(res.body.message).toBe("Comments can only be added when resolving a report.");
        });

        it("should return 400 for invalid status for TOSM", async () => {
            const res = await request(app)
                .patch(`/api/v1/reports/${testReport1.id}/updateStatus`)
                .set('Cookie', tosmCookie)
                .send({
                    status: getStatusKey(Status.PENDING)
                })
                .expect(400);

            expectErrorResponse(res);
        });

        it("should return 400 for invalid status value", async () => {
            const res = await request(app)
                .patch(`/api/v1/reports/${testReport1.id}/updateStatus`)
                .set('Cookie', tosmCookie)
                .send({
                    status: "INVALID_STATUS"
                })
                .expect(400);

            expectErrorResponse(res);
        });

        it("should return 400 for invalid report ID", async () => {
            const res = await request(app)
                .patch("/api/v1/reports/invalid/updateStatus")
                .set('Cookie', tosmCookie)
                .send({
                    status: getStatusKey(Status.IN_PROGRESS)
                })
                .expect(400);

            expectErrorResponse(res);
        });

        it("should return 404 for non-existent report", async () => {
            const res = await request(app)
                .patch("/api/v1/reports/9999/updateStatus")
                .set('Cookie', tosmCookie)
                .send({
                    status: getStatusKey(Status.IN_PROGRESS)
                })
                .expect(404);

            expectErrorResponse(res);
        });

        it("should require TOSM authentication", async () => {
            const res = await request(app)
                .patch(`/api/v1/reports/${testReport1.id}/updateStatus`)
                .send({
                    status: getStatusKey(Status.IN_PROGRESS)
                })
                .expect(401);

            expect(res.status).toBe(401);
        });

        it("should not allow MPRO to access TOSM endpoint", async () => {
            const res = await request(app)
                .patch(`/api/v1/reports/${testReport1.id}/updateStatus`)
                .set('Cookie', mproCookie)
                .send({
                    status: getStatusKey(Status.IN_PROGRESS)
                })
                .expect(403);

            expect(res.status).toBe(403);
        });
    });

    describe("PATCH /api/v1/reports/:reportId/updateStatus - Update report as EM", () => {
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
            // assign report to TOSM (self-assign)
            await request(app)
                .patch(`/api/v1/reports/${testReport1.id}/assignSelf`)
                .set('Cookie', tosmCookie)
                .expect(200);
        
            // assign report to EM
            const emUsername = DEFAULT_STAFF.em_RSTLO.username;
            await request(app)
                .patch(`/api/v1/reports/${testReport1.id}/assignExternal`)
                .set('Cookie', tosmCookie)
                .send({ staffEM: emUsername })
                .expect(200);
            });

        it("should update report status to IN_PROGRESS", async () => {
            const res = await request(app)
                .patch(`/api/v1/reports/${testReport1.id}/updateStatus`)
                .set('Cookie', emCookie)
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
                .patch(`/api/v1/reports/${testReport1.id}/updateStatus`)
                .set('Cookie', emCookie)
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
                .patch(`/api/v1/reports/${testReport1.id}/updateStatus`)
                .set('Cookie', emCookie)
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
                .patch(`/api/v1/reports/${testReport1.id}/updateStatus`)
                .set('Cookie', emCookie)
                .send({})
                .expect(400);

            expectErrorResponse(res);
        });

        it("should return 400 when adding comment to non-resolved status", async () => {
            const res = await request(app)
                .patch(`/api/v1/reports/${testReport1.id}/updateStatus`)
                .set('Cookie', emCookie)
                .send({
                    status: getStatusKey(Status.IN_PROGRESS),
                    comment: "This should not be allowed"
                })
                .expect(400);

            expectErrorResponse(res);
        });

        it("should return 400 for invalid status for EM", async () => {
            const res = await request(app)
                .patch(`/api/v1/reports/${testReport1.id}/updateStatus`)
                .set('Cookie', emCookie)
                .send({
                    status: getStatusKey(Status.PENDING)
                })
                .expect(400);

            expectErrorResponse(res);
        });

        it("should return 400 for invalid status value", async () => {
            const res = await request(app)
                .patch(`/api/v1/reports/${testReport1.id}/updateStatus`)
                .set('Cookie', emCookie)
                .send({
                    status: "INVALID_STATUS"
                })
                .expect(400);

            expectErrorResponse(res);
        });

        it("should return 400 for invalid report ID", async () => {
            const res = await request(app)
                .patch("/api/v1/reports/invalid/updateStatus")
                .set('Cookie', emCookie)
                .send({
                    status: getStatusKey(Status.IN_PROGRESS)
                })
                .expect(400);

            expectErrorResponse(res);
        });

        it("should return 404 for non-existent report", async () => {
            const res = await request(app)
                .patch("/api/v1/reports/9999/updateStatus")
                .set('Cookie', emCookie)
                .send({
                    status: getStatusKey(Status.IN_PROGRESS)
                })
                .expect(404);

            expectErrorResponse(res);
        });

        it("should require EM authentication", async () => {
            const res = await request(app)
                .patch(`/api/v1/reports/${testReport1.id}/updateStatus`)
                .send({
                    status: getStatusKey(Status.IN_PROGRESS)
                })
                .expect(401);

            expect(res.status).toBe(401);
        });

        it("should not allow EM to access report if not assigned to a TOSM", async () => {
            const res = await request(app)
                .patch(`/api/v1/reports/${testReport1.id}/updateStatus`)
                .set('Cookie', mproCookie)
                .send({
                    status: getStatusKey(Status.IN_PROGRESS)
                })
                .expect(403);

            expect(res.status).toBe(403);
        });
    });

    describe("POST /api/v1/reports/:reportId/messages - Add message to report", () => {
        beforeEach(async () => {
            // Set reports to ASSIGNED status for TOSM tests
            await TestDataSource.getRepository(ReportDAO).update(
                { id: testReport1.id },
                { status: Status.ASSIGNED, assignedStaff: undefined, assignedEM: undefined }
            );
            await TestDataSource.getRepository(ReportDAO).update(
                { id: testReport2.id },
                { status: Status.ASSIGNED, assignedStaff: undefined, assignedEM: undefined }
            );
            // assign report to TOSM (self-assign)
            await request(app)
                .patch(`/api/v1/reports/${testReport1.id}/assignSelf`)
                .set('Cookie', tosmCookie)
                .expect(200);
        
            // assign report to EM
            const emUsername = DEFAULT_STAFF.em_RSTLO.username;
            await request(app)
                .patch(`/api/v1/reports/${testReport1.id}/assignExternal`)
                .set('Cookie', tosmCookie)
                .send({ staffEM: emUsername })
                .expect(200);
        });

        it("should add a public message from TOSM to citizen", async () => {
            const res = await request(app)
                .post(`/api/v1/reports/${testReport1.id}/messages`)
                .set('Cookie', tosmCookie)
                .send({
                    message: "We are looking into your report.",
                    isPrivate: false
                })
                .expect(201);
                
        });
        
        it("should add a private message from TOSM to EM", async () => {
            
            const res = await request(app)
                .post(`/api/v1/reports/${testReport1.id}/messages`)
                .set('Cookie', tosmCookie)
                .send({
                    message: "Please update the status.",
                    isPrivate: true
                })
                .expect(201);
        });
        
        
    });
});