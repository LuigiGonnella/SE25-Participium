import request from 'supertest';
import express, { Express } from 'express';
import reportRoutes from '@routes/reportRoutes';
import { beforeAllE2e, DEFAULT_CITIZENS, DEFAULT_STAFF, TestDataManager } from "../../e2e/lifecycle";
import { initializeTestDataSource, closeTestDataSource, TestDataSource } from "../../setup/test-datasource";
import { ReportDAO, Status } from '@dao/reportDAO';
import { NotificationDAO } from '@dao/notificationDAO';
import { MessageDAO } from '@dao/messageDAO';
import { ReportRepository } from '@repositories/reportRepository';
import { OfficeCategory } from '@dao/officeDAO';

let app: Express;
let reportRepo: ReportRepository;

beforeAll(async () => {
    await initializeTestDataSource();
    await beforeAllE2e();
    
    reportRepo = new ReportRepository();
    
    app = express();
    app.use(express.json());
    
    // Mock authentication middleware
    app.use((req: any, res, next) => {
        req.user = { username: DEFAULT_CITIZENS.citizen1.username, type: 'CITIZEN' };
        req.isAuthenticated = () => true;
        next();
    });
    
    app.use('/api/v1/reports', reportRoutes);
});

afterAll(async () => {
    await closeTestDataSource();
});

beforeEach(async () => {
    await TestDataSource.getRepository(NotificationDAO).clear();
    await TestDataSource.getRepository(MessageDAO).clear();
    await TestDataSource.getRepository(ReportDAO).clear();
});

describe('Report Routes Tests', () => {
    describe('GET /api/v1/reports', () => {
        it('should return all reports for default citizen', async () => {
            const citizen = await TestDataManager.getCitizen('citizen1');
            
            await reportRepo.create(
                citizen,
                "Report 1",
                "Description 1",
                OfficeCategory.RSTLO,
                45.0,
                7.0,
                false,
                "/img1.jpg"
            );

            await reportRepo.create(
                citizen,
                "Report 2",
                "Description 2",
                OfficeCategory.WSO,
                45.1,
                7.1,
                false,
                "/img2.jpg"
            );

            const response = await request(app)
                .get('/api/v1/reports')
                .expect(200);

            expect(Array.isArray(response.body)).toBe(true);
            expect(response.body.length).toBe(2);
        });

        it('should return empty array when no reports exist', async () => {
            const response = await request(app)
                .get('/api/v1/reports')
                .expect(200);

            expect(response.body).toEqual([]);
        });

        it('should filter reports by category', async () => {
            const citizen = await TestDataManager.getCitizen('citizen1');
            
            await reportRepo.create(
                citizen,
                "RSTLO Report",
                "Description",
                OfficeCategory.RSTLO,
                45.0,
                7.0,
                false,
                "/img.jpg"
            );

            await reportRepo.create(
                citizen,
                "WSO Report",
                "Description",
                OfficeCategory.WSO,
                45.0,
                7.0,
                false,
                "/img.jpg"
            );

            const response = await request(app)
                .get('/api/v1/reports?category=RSTLO')
                .expect(200);

            expect(response.body.length).toBe(1);
            expect(response.body[0].category).toBe(OfficeCategory.RSTLO);
        });
    });

    describe('GET /api/v1/reports/:id', () => {
        it('should return report by id', async () => {
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

            const response = await request(app)
                .get(`/api/v1/reports/${report.id}`)
                .expect(200);

            expect(response.body.title).toBe("Test Report");
            expect(response.body.id).toBe(report.id);
        });

        it('should return 404 for non-existent report', async () => {
            const response = await request(app)
                .get('/api/v1/reports/99999')
                .expect(404);

            expect(response.body).toHaveProperty('message');
        });
    });

    describe('PATCH /api/v1/reports/:id/manage', () => {
        beforeEach(() => {
            // Mock MPRO user
            app.use((req: any, res, next) => {
                req.user = { username: DEFAULT_STAFF.mpro.username, type: 'STAFF', role: 'MPRO' };
                req.isAuthenticated = () => true;
                next();
            });
        });

        it('should update report status to ASSIGNED', async () => {
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

            const response = await request(app)
                .patch(`/api/v1/reports/${report.id}/manage`)
                .send({ status: 'ASSIGNED' })
                .expect(200);

            expect(response.body.status).toBe(Status.ASSIGNED);
        });
    });

    describe('POST /api/v1/reports/:id/messages', () => {
        it('should add message to report', async () => {
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

            const response = await request(app)
                .post(`/api/v1/reports/${report.id}/messages`)
                .send({ text: 'Test message' })
                .expect(201);

            expect(response.body.text).toBe('Test message');
            expect(response.body.sender).toBe(DEFAULT_CITIZENS.citizen1.username);
        });

        it('should return 404 for non-existent report', async () => {
            const response = await request(app)
                .post('/api/v1/reports/99999/messages')
                .send({ text: 'Test message' })
                .expect(404);

            expect(response.body).toHaveProperty('message');
        });
    });

    describe('GET /api/v1/reports/:id/messages', () => {
        it('should get all messages for a report', async () => {
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

            // Add messages using the controller/service
            await request(app)
                .post(`/api/v1/reports/${report.id}/messages`)
                .send({ text: 'Message 1' });

            await request(app)
                .post(`/api/v1/reports/${report.id}/messages`)
                .send({ text: 'Message 2' });

            const response = await request(app)
                .get(`/api/v1/reports/${report.id}/messages`)
                .expect(200);

            expect(response.body.length).toBe(2);
        });
    });
});