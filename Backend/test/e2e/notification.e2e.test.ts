import request from "supertest";
import { app } from "@app";
import { beforeAllE2e, afterAllE2e } from "@test/e2e/lifecycle";
import { TestDataSource } from "../setup/test-datasource";
import { CitizenDAO } from "@dao/citizenDAO";
import { StaffDAO, StaffRole } from "@dao/staffDAO";
import { ReportDAO, Status } from "@dao/reportDAO";
import { OfficeDAO, OfficeCategory } from "@dao/officeDAO";
import { NotificationDAO } from "@dao/notificationDAO";
import bcrypt from "bcrypt";

describe("Notification API E2E Tests", () => {
    let citizenAgent: any;
    let tosmAgent: any;
    let testCitizen: CitizenDAO;
    let testStaffTOSM: StaffDAO;
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

        // Create test report
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
    });

    describe("GET /api/v1/notifications - Get user notifications", () => {
        it("should return empty array when citizen has no notifications", async () => {
            const res = await citizenAgent
                .get("/api/v1/notifications");

            expect(res.status).toBe(200);
            expect(Array.isArray(res.body)).toBe(true);
            expect(res.body).toHaveLength(0);
        });

        it("should return empty array when staff has no notifications", async () => {
            const res = await tosmAgent
                .get("/api/v1/notifications");

            expect(res.status).toBe(200);
            expect(Array.isArray(res.body)).toBe(true);
            expect(res.body).toHaveLength(0);
        });

        it("should return citizen's notifications", async () => {
            // Create notifications for citizen
            const notificationRepo = TestDataSource.getRepository(NotificationDAO);
            await notificationRepo.save({
                report: testReport,
                title: "New Message",
                message: "You have a new message on your report",
                citizen: testCitizen,
                isRead: false
            });

            await notificationRepo.save({
                report: testReport,
                title: "Report Update",
                message: "Your report status has been updated",
                citizen: testCitizen,
                isRead: true
            });

            const res = await citizenAgent
                .get("/api/v1/notifications");

            expect(res.status).toBe(200);
            expect(res.body).toHaveLength(2);
            expect(res.body[0]).toHaveProperty("id");
            expect(res.body[0]).toHaveProperty("title");
            expect(res.body[0]).toHaveProperty("message");
            expect(res.body[0]).toHaveProperty("reportId");
            expect(res.body[0]).toHaveProperty("isRead");
            expect(res.body[0]).toHaveProperty("timestamp");
        });

        it("should return staff's notifications", async () => {
            // Create notifications for staff
            const notificationRepo = TestDataSource.getRepository(NotificationDAO);
            await notificationRepo.save({
                report: testReport,
                title: "New Report Assigned",
                message: "A new report has been assigned to you",
                staff: testStaffTOSM,
                isRead: false
            });

            const res = await tosmAgent
                .get("/api/v1/notifications");

            expect(res.status).toBe(200);
            expect(res.body).toHaveLength(1);
            expect(res.body[0]).toHaveProperty("title", "New Report Assigned");
            expect(res.body[0]).toHaveProperty("isRead", false);
        });

        it("should return 401 for unauthenticated requests", async () => {
            const res = await request(app)
                .get("/api/v1/notifications");

            expect(res.status).toBe(401);
        });

        it("should only return notifications for the authenticated user", async () => {
            const notificationRepo = TestDataSource.getRepository(NotificationDAO);
            
            // Create notification for citizen
            await notificationRepo.save({
                report: testReport,
                title: "Citizen Notification",
                message: "For citizen only",
                citizen: testCitizen,
                isRead: false
            });

            // Create notification for staff
            await notificationRepo.save({
                report: testReport,
                title: "Staff Notification",
                message: "For staff only",
                staff: testStaffTOSM,
                isRead: false
            });

            // Citizen should only see their notification
            const citizenRes = await citizenAgent
                .get("/api/v1/notifications");

            expect(citizenRes.status).toBe(200);
            expect(citizenRes.body).toHaveLength(1);
            expect(citizenRes.body[0].title).toBe("Citizen Notification");

            // Staff should only see their notification
            const staffRes = await tosmAgent
                .get("/api/v1/notifications");

            expect(staffRes.status).toBe(200);
            expect(staffRes.body).toHaveLength(1);
            expect(staffRes.body[0].title).toBe("Staff Notification");
        });

        it("should include both read and unread notifications", async () => {
            const notificationRepo = TestDataSource.getRepository(NotificationDAO);
            
            await notificationRepo.save({
                report: testReport,
                title: "Unread Notification",
                message: "Not read yet",
                citizen: testCitizen,
                isRead: false
            });

            await notificationRepo.save({
                report: testReport,
                title: "Read Notification",
                message: "Already read",
                citizen: testCitizen,
                isRead: true
            });

            const res = await citizenAgent
                .get("/api/v1/notifications");

            expect(res.status).toBe(200);
            expect(res.body).toHaveLength(2);
            
            const unreadCount = res.body.filter((n: any) => !n.isRead).length;
            const readCount = res.body.filter((n: any) => n.isRead).length;
            
            expect(unreadCount).toBe(1);
            expect(readCount).toBe(1);
        });
    });

    describe("PATCH /api/v1/notifications/:id/read - Mark notification as read", () => {
        it("should mark notification as read successfully", async () => {
            const notificationRepo = TestDataSource.getRepository(NotificationDAO);
            const notification = await notificationRepo.save({
                report: testReport,
                title: "Test Notification",
                message: "Test message",
                citizen: testCitizen,
                isRead: false
            });

            const res = await citizenAgent
                .patch(`/api/v1/notifications/${notification.id}/read`);

            expect(res.status).toBe(200);
            expect(res.body).toHaveProperty("message", "Notification marked as read");

            // Verify the notification was marked as read
            const updated = await notificationRepo.findOne({ where: { id: notification.id } });
            expect(updated?.isRead).toBe(true);
        });

        it("should return 401 for unauthenticated requests", async () => {
            const res = await request(app)
                .patch("/api/v1/notifications/1/read");

            expect(res.status).toBe(401);
        });

        it("should handle non-existent notification ID", async () => {
            const res = await citizenAgent
                .patch("/api/v1/notifications/99999/read");

            expect(res.status).toBe(200);
            // The controller doesn't throw error for non-existent ID, just completes silently
        });

        it("should handle invalid notification ID parameter", async () => {
            const res = await citizenAgent
                .patch("/api/v1/notifications/invalid/read");

            // NaN causes database error
            expect(res.status).toBe(500);
        });

        it("should allow marking already read notification as read again", async () => {
            const notificationRepo = TestDataSource.getRepository(NotificationDAO);
            const notification = await notificationRepo.save({
                report: testReport,
                title: "Test Notification",
                message: "Test message",
                citizen: testCitizen,
                isRead: true
            });

            const res = await citizenAgent
                .patch(`/api/v1/notifications/${notification.id}/read`);

            expect(res.status).toBe(200);

            // Verify it's still read
            const updated = await notificationRepo.findOne({ where: { id: notification.id } });
            expect(updated?.isRead).toBe(true);
        });
    });

    describe("Integration - Notification lifecycle", () => {
        it("should handle complete notification workflow", async () => {
            // Create notification
            const notificationRepo = TestDataSource.getRepository(NotificationDAO);
            const notification = await notificationRepo.save({
                report: testReport,
                title: "Integration Test",
                message: "Complete workflow test",
                citizen: testCitizen,
                isRead: false
            });

            // Step 1: Get notifications (should be unread)
            const getRes1 = await citizenAgent
                .get("/api/v1/notifications");

            expect(getRes1.status).toBe(200);
            expect(getRes1.body).toHaveLength(1);
            expect(getRes1.body[0].isRead).toBe(false);

            // Step 2: Mark as read
            const markReadRes = await citizenAgent
                .patch(`/api/v1/notifications/${notification.id}/read`);

            expect(markReadRes.status).toBe(200);

            // Step 3: Get notifications again (should be read)
            const getRes2 = await citizenAgent
                .get("/api/v1/notifications");

            expect(getRes2.status).toBe(200);
            expect(getRes2.body).toHaveLength(1);
            expect(getRes2.body[0].isRead).toBe(true);
        });

        it("should handle multiple notifications being marked as read", async () => {
            const notificationRepo = TestDataSource.getRepository(NotificationDAO);
            
            // Create multiple notifications
            const n1 = await notificationRepo.save({
                report: testReport,
                title: "Notification 1",
                message: "Message 1",
                citizen: testCitizen,
                isRead: false
            });

            const n2 = await notificationRepo.save({
                report: testReport,
                title: "Notification 2",
                message: "Message 2",
                citizen: testCitizen,
                isRead: false
            });

            const n3 = await notificationRepo.save({
                report: testReport,
                title: "Notification 3",
                message: "Message 3",
                citizen: testCitizen,
                isRead: false
            });

            // Mark them as read one by one
            await citizenAgent.patch(`/api/v1/notifications/${n1.id}/read`);
            await citizenAgent.patch(`/api/v1/notifications/${n2.id}/read`);
            await citizenAgent.patch(`/api/v1/notifications/${n3.id}/read`);

            // Verify all are marked as read
            const res = await citizenAgent.get("/api/v1/notifications");

            expect(res.status).toBe(200);
            expect(res.body).toHaveLength(3);
            expect(res.body.every((n: any) => n.isRead === true)).toBe(true);
        });
    });

    describe("Edge cases", () => {
        it("should handle notifications with special characters in title and message", async () => {
            const notificationRepo = TestDataSource.getRepository(NotificationDAO);
            const specialTitle = "Test @#$%^&*(){}[]|\\:;\"'<>,.?/~`";
            const specialMessage = "Message with special chars: @#$%^&*() and newlines\nLine 2\nLine 3";

            await notificationRepo.save({
                report: testReport,
                title: specialTitle,
                message: specialMessage,
                citizen: testCitizen,
                isRead: false
            });

            const res = await citizenAgent
                .get("/api/v1/notifications");

            expect(res.status).toBe(200);
            expect(res.body).toHaveLength(1);
            expect(res.body[0].title).toBe(specialTitle);
            expect(res.body[0].message).toBe(specialMessage);
        });

        it("should handle long notification messages", async () => {
            const notificationRepo = TestDataSource.getRepository(NotificationDAO);
            const longMessage = "A".repeat(1000);

            await notificationRepo.save({
                report: testReport,
                title: "Long Message Test",
                message: longMessage,
                citizen: testCitizen,
                isRead: false
            });

            const res = await citizenAgent
                .get("/api/v1/notifications");

            expect(res.status).toBe(200);
            expect(res.body).toHaveLength(1);
            expect(res.body[0].message).toBe(longMessage);
            expect(res.body[0].message.length).toBe(1000);
        });

        it("should handle large number of notifications", async () => {
            const notificationRepo = TestDataSource.getRepository(NotificationDAO);
            
            // Create 50 notifications
            for (let i = 0; i < 50; i++) {
                await notificationRepo.save({
                    report: testReport,
                    title: `Notification ${i + 1}`,
                    message: `Message ${i + 1}`,
                    citizen: testCitizen,
                    isRead: i % 2 === 0
                });
            }

            const res = await citizenAgent
                .get("/api/v1/notifications");

            expect(res.status).toBe(200);
            expect(res.body).toHaveLength(50);
        });
    });
});
