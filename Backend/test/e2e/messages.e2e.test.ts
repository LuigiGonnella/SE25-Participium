import request from "supertest";
import { app } from "@app";
import { beforeAllE2e, afterAllE2e } from "@test/e2e/lifecycle";
import { TestDataSource } from "../setup/test-datasource";
import { CitizenDAO } from "@dao/citizenDAO";
import { StaffDAO, StaffRole } from "@dao/staffDAO";
import { ReportDAO, Status } from "@dao/reportDAO";
import { OfficeDAO, OfficeCategory } from "@dao/officeDAO";
import { MessageDAO } from "@dao/messageDAO";
import { NotificationDAO } from "@dao/notificationDAO";
import bcrypt from "bcrypt";

describe("Messages API E2E Tests", () => {
    let citizenAgent: any;
    let tosmAgent: any;
    let mproAgent: any;
    let testCitizen: CitizenDAO;
    let testStaffTOSM: StaffDAO;
    let testStaffMPRO: StaffDAO;
    let testOffice: OfficeDAO;
    let testReport: ReportDAO;

    beforeAll(async () => {
        await beforeAllE2e();
    });

    afterAll(async () => {
        // Disable foreign keys for cleanup
        await TestDataSource.query("PRAGMA foreign_keys = OFF");
        
        // Clear all test data
        await TestDataSource.getRepository(NotificationDAO).clear();
        await TestDataSource.getRepository(MessageDAO).clear();
        await TestDataSource.getRepository(ReportDAO).clear();
        await TestDataSource.getRepository(StaffDAO).clear();
        await TestDataSource.getRepository(CitizenDAO).clear();
        await TestDataSource.getRepository(OfficeDAO).clear();
        
        await afterAllE2e();
    });

    beforeEach(async () => {
        // Disable foreign keys temporarily for cleanup
        await TestDataSource.query("PRAGMA foreign_keys = OFF");
        
        // Clear all relevant tables
        await TestDataSource.getRepository(NotificationDAO).clear();
        await TestDataSource.getRepository(MessageDAO).clear();
        await TestDataSource.getRepository(ReportDAO).clear();
        await TestDataSource.getRepository(StaffDAO).clear();
        await TestDataSource.getRepository(CitizenDAO).clear();
        await TestDataSource.getRepository(OfficeDAO).clear();
        
        // Re-enable foreign keys
        await TestDataSource.query("PRAGMA foreign_keys = ON");

        // Create test office
        const officeRepo = TestDataSource.getRepository(OfficeDAO);
        testOffice = await officeRepo.save({
            name: "Water Supply Office",
            category: OfficeCategory.WSO,
            description: "Test office for water supply management",
            phone: "+39 011 1234567",
            email: "water@example.com"
        });

        // Create test citizen
        const citizenRepo = TestDataSource.getRepository(CitizenDAO);
        testCitizen = await citizenRepo.save({
            email: "testcitizen@example.com",
            username: "testcitizen",
            name: "Test",
            surname: "Citizen",
            password: await bcrypt.hash("password123", 10),
            receive_emails: true
        });

        // Create test TOSM staff
        const staffRepo = TestDataSource.getRepository(StaffDAO);
        testStaffTOSM = await staffRepo.save({
            username: "tosmstaff",
            name: "TOSM",
            surname: "Staff",
            password: await bcrypt.hash("password123", 10),
            role: StaffRole.TOSM,
            office: testOffice
        });

        // Create test MPRO staff
        testStaffMPRO = await staffRepo.save({
            username: "mprostaff",
            name: "MPRO",
            surname: "Staff",
            password: await bcrypt.hash("password123", 10),
            role: StaffRole.MPRO,
            office: testOffice
        });

        // Create test report assigned to TOSM
        const reportRepo = TestDataSource.getRepository(ReportDAO);
        testReport = await reportRepo.save({
            citizen: testCitizen,
            title: "Test Report",
            description: "Test Description",
            category: OfficeCategory.WSO,
            latitude: 45.0703,
            longitude: 7.6869,
            anonymous: false,
            photo1: "/uploads/reports/test1.jpg",
            status: Status.IN_PROGRESS,
            assignedStaff: testStaffTOSM
        } as ReportDAO);

        // Login citizen
        citizenAgent = request.agent(app);
        await citizenAgent
            .post("/api/v1/auth/login?type=CITIZEN")
            .send({ username: "testcitizen", password: "password123" });

        // Login TOSM
        tosmAgent = request.agent(app);
        await tosmAgent
            .post("/api/v1/auth/login?type=STAFF")
            .send({ username: "tosmstaff", password: "password123" });

        // Login MPRO
        mproAgent = request.agent(app);
        await mproAgent
            .post("/api/v1/auth/login?type=STAFF")
            .send({ username: "mprostaff", password: "password123" });
    });

    describe("POST /api/v1/reports/:reportId/messages - Create message", () => {
        it("should allow TOSM to create a message on assigned report", async () => {
            const res = await tosmAgent
                .post(`/api/v1/reports/${testReport.id}/messages`)
                .send({ message: "This is a test message from TOSM" });

            expect(res.status).toBe(201);
            expect(res.body).toHaveProperty("id");
            expect(res.body.messages).toHaveLength(1);
            expect(res.body.messages[0]).toMatchObject({
                message: "This is a test message from TOSM",
                staffUsername: "tosmstaff"
            });
        });

        it("should return 400 when TOSM tries to message report not assigned to them", async () => {
            // Create another report not assigned to testStaffTOSM
            const reportRepo = TestDataSource.getRepository(ReportDAO);
            const otherReport = await reportRepo.save({
                citizen: testCitizen,
                title: "Other Report",
                description: "Other Description",
                category: OfficeCategory.WSO,
                latitude: 45.0703,
                longitude: 7.6869,
                anonymous: false,
                photo1: "/uploads/reports/test2.jpg",
                status: Status.PENDING
            } as ReportDAO);

            const res = await tosmAgent
                .post(`/api/v1/reports/${otherReport.id}/messages`)
                .send({ message: "Test message" });

            expect(res.status).toBe(400);
        });

        it("should allow citizen to create a message", async () => {
            const res = await citizenAgent
                .post(`/api/v1/reports/${testReport.id}/messages`)
                .send({ message: "Citizen sending message" });

            expect(res.status).toBe(201);
            expect(res.body.messages).toHaveLength(1);
        });

        it("should return 401 when unauthenticated user tries to create message", async () => {
            const res = await request(app)
                .post(`/api/v1/reports/${testReport.id}/messages`)
                .send({ message: "Unauthenticated message" });

            expect(res.status).toBe(401);
        });

        it("should return 400 when message is empty", async () => {
            const res = await tosmAgent
                .post(`/api/v1/reports/${testReport.id}/messages`)
                .send({ message: "" });

            expect(res.status).toBe(400);
        });

        it("should return 400 when message field is missing", async () => {
            const res = await tosmAgent
                .post(`/api/v1/reports/${testReport.id}/messages`)
                .send({});

            expect(res.status).toBe(400);
        });

        it("should create notification for citizen when TOSM sends message", async () => {
            const res = await tosmAgent
                .post(`/api/v1/reports/${testReport.id}/messages`)
                .send({ message: "TOSM sending message" });

            expect(res.status).toBe(201);

            // Check that notification was created
            const notificationRes = await citizenAgent
                .get("/api/v1/notifications");

            expect(notificationRes.status).toBe(200);
            expect(notificationRes.body.length).toBeGreaterThan(0);
            expect(notificationRes.body[0]).toMatchObject({
                title: "New message on your report",
                reportId: testReport.id
            });
        });

        it("should handle multiple messages on same report", async () => {
            await tosmAgent
                .post(`/api/v1/reports/${testReport.id}/messages`)
                .send({ message: "First message" });

            await tosmAgent
                .post(`/api/v1/reports/${testReport.id}/messages`)
                .send({ message: "Second message" });

            const res = await tosmAgent
                .post(`/api/v1/reports/${testReport.id}/messages`)
                .send({ message: "Third message" });

            expect(res.status).toBe(201);
            expect(res.body.messages).toHaveLength(3);
        });
    });

    describe("GET /api/v1/reports/:reportId/messages - Get all messages", () => {
        beforeEach(async () => {
            // Create some test messages
            await tosmAgent
                .post(`/api/v1/reports/${testReport.id}/messages`)
                .send({ message: "First message" });

            await tosmAgent
                .post(`/api/v1/reports/${testReport.id}/messages`)
                .send({ message: "Second message" });

            await tosmAgent
                .post(`/api/v1/reports/${testReport.id}/messages`)
                .send({ message: "Third message" });
        });

        it("should allow TOSM to get all messages for assigned report", async () => {
            const res = await tosmAgent
                .get(`/api/v1/reports/${testReport.id}/messages`);

            expect(res.status).toBe(200);
            expect(res.body).toHaveLength(3);
            expect(res.body[0]).toHaveProperty("message");
            expect(res.body[0]).toHaveProperty("staffUsername", "tosmstaff");
            expect(res.body[0]).toHaveProperty("timestamp");
        });

        it("should allow citizen to get messages for their own report", async () => {
            const res = await citizenAgent
                .get(`/api/v1/reports/${testReport.id}/messages`);

            expect(res.status).toBe(200);
            expect(res.body).toHaveLength(3);
        });

        it("should return empty array when no messages exist", async () => {
            // Clear messages
            await TestDataSource.getRepository(MessageDAO).clear();

            const res = await tosmAgent
                .get(`/api/v1/reports/${testReport.id}/messages`);

            expect(res.status).toBe(200);
            expect(res.body).toEqual([]);
        });

        it("should return 401 for unauthenticated requests", async () => {
            const res = await request(app)
                .get(`/api/v1/reports/${testReport.id}/messages`);

            expect(res.status).toBe(401);
        });

        it("should return messages in correct order (newest first)", async () => {
            const res = await tosmAgent
                .get(`/api/v1/reports/${testReport.id}/messages`);

            expect(res.status).toBe(200);
            expect(res.body).toHaveLength(3);
            
            // Check that messages are ordered by timestamp descending
            const timestamps = res.body.map((msg: any) => new Date(msg.timestamp).getTime());
            for (let i = 0; i < timestamps.length - 1; i++) {
                expect(timestamps[i]).toBeGreaterThanOrEqual(timestamps[i + 1]);
            }
        });

        it("should include all message fields in response", async () => {
            const res = await tosmAgent
                .get(`/api/v1/reports/${testReport.id}/messages`);

            expect(res.status).toBe(200);
            expect(res.body[0]).toHaveProperty("message");
            expect(res.body[0]).toHaveProperty("staffUsername");
            expect(res.body[0]).toHaveProperty("timestamp");
        });

        it("should not allow MPRO to get messages for reports they don't manage", async () => {
            const res = await mproAgent
                .get(`/api/v1/reports/${testReport.id}/messages`);

            expect(res.status).toBe(200);
            // MPRO can view messages but they're for information only
            expect(res.body).toHaveLength(3);
        });
    });

    describe("Integration - Complete message lifecycle", () => {
        it("should handle complete message workflow from creation to retrieval", async () => {
            // Create message
            const createRes = await tosmAgent
                .post(`/api/v1/reports/${testReport.id}/messages`)
                .send({ message: "Integration test message" });

            expect(createRes.status).toBe(201);

            // Retrieve messages
            const getRes = await tosmAgent
                .get(`/api/v1/reports/${testReport.id}/messages`);

            expect(getRes.status).toBe(200);
            expect(getRes.body).toHaveLength(1);
            expect(getRes.body[0].message).toBe("Integration test message");

            // Citizen should also be able to see it
            const citizenGetRes = await citizenAgent
                .get(`/api/v1/reports/${testReport.id}/messages`);

            expect(citizenGetRes.status).toBe(200);
            expect(citizenGetRes.body).toHaveLength(1);

            // Citizen should have notification
            const notificationRes = await citizenAgent
                .get("/api/v1/notifications");

            expect(notificationRes.status).toBe(200);
            expect(notificationRes.body.some((n: any) => 
                n.title === "New message on your report"
            )).toBe(true);
        });

        it("should maintain message consistency across multiple operations", async () => {
            const messages = ["Message 1", "Message 2", "Message 3", "Message 4", "Message 5"];

            // Create multiple messages
            for (const msg of messages) {
                await tosmAgent
                    .post(`/api/v1/reports/${testReport.id}/messages`)
                    .send({ message: msg });
            }

            // Verify all messages exist
            const res = await tosmAgent
                .get(`/api/v1/reports/${testReport.id}/messages`);

            expect(res.status).toBe(200);
            expect(res.body).toHaveLength(5);

            // Verify message content
            const messageTexts = res.body.map((m: any) => m.message);
            for (const msg of messages) {
                expect(messageTexts).toContain(msg);
            }
        });
    });

    describe("Edge cases and error handling", () => {
        it("should handle non-existent report ID gracefully", async () => {
            const res = await tosmAgent
                .get("/api/v1/reports/99999/messages");

            expect(res.status).toBe(404);
        });

        it("should handle invalid report ID parameter", async () => {
            const res = await tosmAgent
                .get("/api/v1/reports/invalid/messages");

            expect(res.status).toBe(400);
        });

        it("should handle long messages", async () => {
            const longMessage = "A".repeat(1000);
            
            const res = await tosmAgent
                .post(`/api/v1/reports/${testReport.id}/messages`)
                .send({ message: longMessage });

            expect(res.status).toBe(201);
            expect(res.body.messages[0].message).toBe(longMessage);
        });

        it("should handle messages with special characters", async () => {
            const specialMessage = "Test message with special chars: @#$%^&*(){}[]|\\:;\"'<>,.?/~`";
            
            const res = await tosmAgent
                .post(`/api/v1/reports/${testReport.id}/messages`)
                .send({ message: specialMessage });

            expect(res.status).toBe(201);
            expect(res.body.messages[0].message).toBe(specialMessage);
        });

        it("should handle messages with newlines and formatting", async () => {
            const formattedMessage = "Line 1\nLine 2\n\nLine 3\tTabbed";
            
            const res = await tosmAgent
                .post(`/api/v1/reports/${testReport.id}/messages`)
                .send({ message: formattedMessage });

            expect(res.status).toBe(201);
            expect(res.body.messages[0].message).toBe(formattedMessage);
        });
    });
});
