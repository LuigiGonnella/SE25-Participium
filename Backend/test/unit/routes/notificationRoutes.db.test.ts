import request from 'supertest';
import express, { Express } from 'express';
import notificationRoutes from '@routes/notificationRoutes';
import { beforeAllE2e, DEFAULT_CITIZENS, DEFAULT_STAFF, TestDataManager } from "../../e2e/lifecycle";
import { initializeTestDataSource, closeTestDataSource, TestDataSource } from "../../setup/test-datasource";
import { NotificationDAO } from '@dao/notificationDAO';
import { ReportDAO } from '@dao/reportDAO';
import { NotificationRepository } from '@repositories/notificationRepository';
import { ReportRepository } from '@repositories/reportRepository';
import { OfficeCategory } from '@dao/officeDAO';

let app: Express;
let notificationRepo: NotificationRepository;
let reportRepo: ReportRepository;

beforeAll(async () => {
    await initializeTestDataSource();
    await beforeAllE2e();
    
    notificationRepo = new NotificationRepository();
    reportRepo = new ReportRepository();
    
    app = express();
    app.use(express.json());
    
    // Mock authentication middleware
    app.use((req: any, res, next) => {
        req.user = { username: DEFAULT_CITIZENS.citizen1.username, type: 'CITIZEN' };
        req.isAuthenticated = () => true;
        next();
    });
    
    app.use('/api/v1/notifications', notificationRoutes);
});

afterAll(async () => {
    await closeTestDataSource();
});

beforeEach(async () => {
    await TestDataSource.getRepository(NotificationDAO).clear();
    await TestDataSource.getRepository(ReportDAO).clear();
});

describe('Notification Routes Tests', () => {
    describe('GET /api/v1/notifications', () => {
        it('should return notifications for default citizen', async () => {
            const citizen = await TestDataManager.getCitizen('citizen1');
            const report = await reportRepo.create(
                citizen,
                "Test Report",
                "Description",
                OfficeCategory.RSTLO,
                45.0,
                7.0,
                false,
                "/img.jpg"
            );

            await notificationRepo.createNotificationForCitizen(report, "Test Title", "Test Message");
            await notificationRepo.createNotificationForCitizen(report, "Test Title 2", "Test Message 2");

            const response = await request(app)
                .get('/api/v1/notifications')
                .expect(200);

            expect(Array.isArray(response.body)).toBe(true);
            expect(response.body.length).toBe(2);
        });

        it('should return empty array when no notifications exist', async () => {
            const response = await request(app)
                .get('/api/v1/notifications')
                .expect(200);

            expect(response.body).toEqual([]);
        });
    });

    describe('PATCH /api/v1/notifications/:id/read', () => {
        it('should mark notification as read', async () => {
            const citizen = await TestDataManager.getCitizen('citizen1');
            const report = await reportRepo.create(
                citizen,
                "Test Report",
                "Description",
                OfficeCategory.RSTLO,
                45.0,
                7.0,
                false,
                "/img.jpg"
            );

            const notification = await notificationRepo.createNotificationForCitizen(
                report,
                "Test Title",
                "Test Message"
            );

            const response = await request(app)
                .patch(`/api/v1/notifications/${notification.id}/read`)
                .expect(200);

            const updated = await TestDataSource
                .getRepository(NotificationDAO)
                .findOneBy({ id: notification.id });

            expect(updated?.isRead).toBe(true);
        });

        it('should return 404 for non-existent notification', async () => {
            const response = await request(app)
                .patch('/api/v1/notifications/99999/read')
                .expect(404);

            expect(response.body).toHaveProperty('message');
        });
    });

    describe('Staff notifications', () => {
        beforeEach(() => {
            // Mock staff user
            app.use((req: any, res, next) => {
                req.user = { username: DEFAULT_STAFF.tosm_RSTLO.username, type: 'STAFF' };
                req.isAuthenticated = () => true;
                next();
            });
        });

        it('should return notifications for default staff', async () => {
            await notificationRepo.createNotificationForStaff(
                DEFAULT_STAFF.tosm_RSTLO.username,
                "Staff Notification",
                "Staff Message"
            );

            const response = await request(app)
                .get('/api/v1/notifications')
                .expect(200);

            expect(response.body.length).toBeGreaterThanOrEqual(1);
        });
    });
});