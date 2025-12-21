import request from 'supertest';
import express, { Express } from 'express';
import notificationRoutes from '@routes/notificationRoutes';
import authRoutes from '@routes/authRoutes';
import session from 'express-session';
import passport from 'passport';
import { configurePassport } from '@config/passport';
import { beforeAllE2e, DEFAULT_CITIZENS, DEFAULT_STAFF, TestDataManager } from "../../e2e/lifecycle";
import { initializeTestDataSource, closeTestDataSource, TestDataSource } from "../../setup/test-datasource";
import { NotificationDAO } from '@dao/notificationDAO';
import { ReportDAO } from '@dao/reportDAO';
import { NotificationRepository } from '@repositories/notificationRepository';
import { ReportRepository } from '@repositories/reportRepository';
import { OfficeCategory } from '@dao/officeDAO';
import { errorHandler } from '@middlewares/errorMiddleware';

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
    
    // Session and passport setup for authentication
    app.use(session({
        secret: 'test-secret',
        resave: false,
        saveUninitialized: false,
        cookie: { secure: false }
    }));
    app.use(passport.initialize());
    app.use(passport.session());
    // Configure passport strategies
    configurePassport();
    
    app.use('/api/v1/auth', authRoutes);
    app.use('/api/v1/notifications', notificationRoutes);
    app.use(errorHandler);
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
            const report = await reportRepo.create({
                citizen,
                title: "Test Report",
                description: "Description",
                category: OfficeCategory.RSTLO,
                latitude: 45,
                longitude: 7,
                anonymous: false,
                photo1: "/img.jpg"
            });

            await notificationRepo.createNotificationForCitizen(report, "Test Title", "Test Message");
            await notificationRepo.createNotificationForCitizen(report, "Test Title 2", "Test Message 2");

            const agent = request.agent(app);
            await agent.post('/api/v1/auth/login?type=CITIZEN')
                .send({ username: DEFAULT_CITIZENS.citizen1.username, password: 'cit123' })
                .expect(200);

            const response = await agent
                .get('/api/v1/notifications')
                .expect(200);

            expect(Array.isArray(response.body)).toBe(true);
            expect(response.body.length).toBe(2);
        });

        it('should return empty array when no notifications exist', async () => {
            const agent = request.agent(app);
            await agent.post('/api/v1/auth/login?type=CITIZEN')
                .send({ username: DEFAULT_CITIZENS.citizen1.username, password: 'cit123' })
                .expect(200);

            const response = await agent
                .get('/api/v1/notifications')
                .expect(200);

            expect(response.body).toEqual([]);
        });
    });

    describe('PATCH /api/v1/notifications/:id/read', () => {
        it('should mark notification as read', async () => {
            const citizen = await TestDataManager.getCitizen('citizen1');
            const report = await reportRepo.create({
                citizen,
                title: "Test Report",
                description: "Description",
                category: OfficeCategory.RSTLO,
                latitude: 45,
                longitude: 7,
                anonymous: false,
                photo1: "/img.jpg"
            });

            const notification = await notificationRepo.createNotificationForCitizen(
                report,
                "Test Title",
                "Test Message"
            );

            const agent = request.agent(app);
            await agent.post('/api/v1/auth/login?type=CITIZEN')
                .send({ username: DEFAULT_CITIZENS.citizen1.username, password: 'cit123' })
                .expect(200);

            await agent
                .patch(`/api/v1/notifications/${notification.id}/read`)
                .expect(200);

            const updated = await TestDataSource
                .getRepository(NotificationDAO)
                .findOneBy({ id: notification.id });

            expect(updated?.isRead).toBe(true);
        });

        it('should return 404 for non-existent notification', async () => {
            const agent = request.agent(app);
            await agent.post('/api/v1/auth/login?type=CITIZEN')
                .send({ username: DEFAULT_CITIZENS.citizen1.username, password: 'cit123' })
                .expect(200);

            const response = await agent
                .patch('/api/v1/notifications/99999/read')
                .expect(404);

            expect(response.body).toHaveProperty('message');
        });
    });

    describe('Staff notifications', () => {
        it('should return notifications for default staff', async () => {
            // Create notification first
            await notificationRepo.createNotificationForStaff(
                DEFAULT_STAFF.tosm_RSTLO.username,
                "Staff Notification",
                "Staff Message"
            );

            const agent = request.agent(app);
            await agent.post('/api/v1/auth/login?type=STAFF')
                .send({ username: DEFAULT_STAFF.tosm_RSTLO.username, password: 'tosm123' })
                .expect(200);

            const response = await agent
                .get('/api/v1/notifications')
                .expect(200);

            expect(response.body.length).toBeGreaterThanOrEqual(1);
        });
    });
});
