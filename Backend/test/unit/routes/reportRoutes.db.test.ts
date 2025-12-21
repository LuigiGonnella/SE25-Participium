import request from 'supertest';
import express, { Express } from 'express';
import reportRoutes from '@routes/reportRoutes';
import authRoutes from '@routes/authRoutes';
import session from 'express-session';
import passport from 'passport';
import { configurePassport } from '@config/passport';
import { beforeAllE2e, DEFAULT_CITIZENS, DEFAULT_STAFF, TestDataManager } from "../../e2e/lifecycle";
import { initializeTestDataSource, closeTestDataSource, TestDataSource } from "../../setup/test-datasource";
import { ReportDAO, Status } from '@dao/reportDAO';
import { NotificationDAO } from '@dao/notificationDAO';
import { MessageDAO } from '@dao/messageDAO';
import { ReportRepository } from '@repositories/reportRepository';
import { OfficeCategory } from '@dao/officeDAO';
import { errorHandler } from '@middlewares/errorMiddleware';

let app: Express;
let reportRepo: ReportRepository;

// --- Test helpers for mocking users ---
function mockUser(user: any) {
    return (req: any, res: any, next: any) => {
        req.user = user;
        req.isAuthenticated = () => true;
        next();
    };
}

beforeAll(async () => {
    await initializeTestDataSource();
    await beforeAllE2e();
    
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
    app.use('/api/v1/reports', reportRoutes);
    app.use(errorHandler);
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
            
            await reportRepo.create({
                citizen,
                title: "Report 1",
                description: "Description 1",
                category: OfficeCategory.RSTLO,
                latitude: 45,
                longitude: 7,
                anonymous: false,
                photo1: "/img1.jpg"
            });

            await reportRepo.create({
                citizen,
                title: "Report 2",
                description: "Description 2",
                category: OfficeCategory.WSO,
                latitude: 45.1,
                longitude: 7.1,
                anonymous: false,
                photo1: "/img2.jpg"
            });

            const agent = request.agent(app);
            await agent.post('/api/v1/auth/login?type=STAFF')
                .send({ username: 'mpro', password: 'mpro123' })
                .expect(200);

            const response = await agent
                .get('/api/v1/reports')
                .expect(200);

            expect(Array.isArray(response.body)).toBe(true);
            expect(response.body.length).toBe(2);
        });

        it('should return empty array when no reports exist', async () => {
            const agent = request.agent(app);
            await agent.post('/api/v1/auth/login?type=STAFF')
                .send({ username: 'mpro', password: 'mpro123' })
                .expect(200);
                
            const response = await agent
                .get('/api/v1/reports')
                .expect(200);

            expect(response.body).toEqual([]);
        });

        it('should filter reports by category', async () => {
            const citizen = await TestDataManager.getCitizen('citizen1');
            
            await reportRepo.create({
                citizen,
                title: "RSTLO Report",
                description: "Description",
                category: OfficeCategory.RSTLO,
                latitude: 45,
                longitude: 7,
                anonymous: false,
                photo1: "/img.jpg"
            });

            await reportRepo.create({
                citizen,
                title: "WSO Report",
                description: "Description",
                category: OfficeCategory.WSO,
                latitude: 45,
                longitude: 7,
                anonymous: false,
                photo1: "/img.jpg"
            });

            const agent = request.agent(app);
            await agent.post('/api/v1/auth/login?type=STAFF')
                .send({ username: 'mpro', password: 'mpro123' })
                .expect(200);

            const response = await agent
                .get('/api/v1/reports?category=RSTLO')
                .expect(200);

            expect(response.body.length).toBe(1);
            expect(response.body[0].category).toBe(OfficeCategory.RSTLO);
        });
    });

    describe('GET /api/v1/reports/:id', () => {
        it('should return report by id', async () => {
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

            const agent = request.agent(app);
            await agent.post('/api/v1/auth/login?type=STAFF')
                .send({ username: 'mpro', password: 'mpro123' })
                .expect(200);

            const response = await agent
                .get(`/api/v1/reports/${report.id}`)
                .expect(200);

            expect(response.body.title).toBe("Test Report");
            expect(response.body.id).toBe(report.id);
        });

        it('should return 404 for non-existent report', async () => {
            const agent = request.agent(app);
            await agent.post('/api/v1/auth/login?type=STAFF')
                .send({ username: 'mpro', password: 'mpro123' })
                .expect(200);

            const response = await agent
                .get('/api/v1/reports/99999')
                .expect(404);

            expect(response.body).toHaveProperty('message');
        });
    });

    describe('PATCH /api/v1/reports/:id/manage', () => {
        beforeEach(() => {
            // Mock MPRO user
            app.use(mockUser({ username: DEFAULT_STAFF.mpro.username, type: 'STAFF', role: 'MPRO' }));
        });

        it('should update report status to ASSIGNED', async () => {
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

            const agent = request.agent(app);
            await agent.post('/api/v1/auth/login?type=STAFF')
                .send({ username: 'mpro', password: 'mpro123' })
                .expect(200);

            const response = await agent
                .patch(`/api/v1/reports/${report.id}/manage`)
                .send({ status: 'ASSIGNED' })
                .expect(200);

            expect(response.body.status).toBe(Status.ASSIGNED);
        });
    });

    describe('PATCH /api/v1/reports/:id/updateStatus', () => {
        beforeEach(() => {
            // Mock MPRO user
            app.use(mockUser({ username: DEFAULT_STAFF.mpro.username, type: 'STAFF', role: 'MPRO' }));
            // Mock TOSM user
            app.use(mockUser({ username: DEFAULT_STAFF.tosm_RSTLO.username, type: 'STAFF', role: 'TOSM' }));
        });

        it('should update report status to IN_PROGRESS by EM', async () => {
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
            const agent = request.agent(app);
            //assign to MPRO
            await agent.post('/api/v1/auth/login?type=STAFF')
                .send({ username: 'mpro', password: 'mpro123' })
                .expect(200);
            await agent
                .patch(`/api/v1/reports/${report.id}/manage`)
                .send({ status: 'ASSIGNED' })
                .expect(200);

            //self-assign to TOSM
            await agent.post('/api/v1/auth/login?type=STAFF')
                .send({ username: 'tosm_RSTLO', password: 'tosm123' })
                .expect(200);
            await agent
                .patch(`/api/v1/reports/${report.id}/assignSelf`)
                .send({ status: 'IN_PROGRESS', comment: 'Starting work' })
                .expect(200);

            //assign to EM
            await agent
                .patch(`/api/v1/reports/${report.id}/assignExternal`)
                .send({ staffEM: 'em_RSTLO' })
                .expect(200);

            await agent.post('/api/v1/auth/login?type=STAFF')
                .send({ username: 'em_RSTLO', password: 'em123' })
                .expect(200);
            

            const response = await agent
                .patch(`/api/v1/reports/${report.id}/updateStatus`)
                .send({ status: 'IN_PROGRESS' })  
                .expect(200);

            expect(response.body.status).toBe(Status.IN_PROGRESS);
        });
    });

    describe('POST /api/v1/reports/:id/messages', () => {
        it('should add message to report', async () => {
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

            const agent = request.agent(app);
            await agent.post('/api/v1/auth/login?type=CITIZEN')
                .send({ username: DEFAULT_CITIZENS.citizen1.username, password: 'cit123' })
                .expect(200);

            const response = await agent
                .post(`/api/v1/reports/${report.id}/messages`)
                .send({ message: 'Test message' })
                .expect(201);

            expect(response.body.messages).toBeDefined();
            expect(response.body.messages.length).toBeGreaterThan(0);
            const addedMessage = response.body.messages[response.body.messages.length - 1];
            expect(addedMessage.message).toBe('Test message');
            expect(addedMessage.staffUsername).toBeUndefined(); // Citizen message should not have staffUsername
        });

        it('should return 404 for non-existent report', async () => {
            const agent = request.agent(app);
            await agent.post('/api/v1/auth/login?type=CITIZEN')
                .send({ username: DEFAULT_CITIZENS.citizen1.username, password: 'cit123' })
                .expect(200);

            const response = await agent
                .post('/api/v1/reports/99999/messages')
                .send({ message: 'Test message' })
                .expect(404);

            expect(response.body).toHaveProperty('message');
        });

        it('should create a new message from TOSM', async () => {
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

            const agentMPRO = request.agent(app);
            const agentTOSM = request.agent(app);

            //MPRO assigns report
            await agentMPRO.post('/api/v1/auth/login?type=STAFF')
                .send({ username: DEFAULT_STAFF.mpro.username, password: DEFAULT_STAFF.mpro.password })

            await agentMPRO.patch(`/api/v1/reports/${report.id}/manage`)
                .send({ status: 'ASSIGNED' })

            //TOSM self-assigns
            await agentTOSM.post('/api/v1/auth/login?type=STAFF')
                .send({ username: DEFAULT_STAFF.tosm_RSTLO.username, password: DEFAULT_STAFF.tosm_RSTLO.password })

            await agentTOSM.patch(`/api/v1/reports/${report.id}/assignSelf`)
                .send({ status: 'IN_PROGRESS' })

            //TOSM adds a message
            const res = await agentTOSM.post(`/api/v1/reports/${report.id}/messages`)
                .send({ message: 'Test message from TOSM', isPrivate: true })
                .expect(201);
            
            expect(res.body).toBeDefined();
            expect(res.body.id).toBe(report.id);
            expect(res.body.title).toBe("Test Report");
        });

        it('should create a new message from EM', async () => {
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

            const agentMPRO = request.agent(app);
            const agentTOSM = request.agent(app);
            const agentEM = request.agent(app);

            //MPRO assigns report
            await agentMPRO.post('/api/v1/auth/login?type=STAFF')
                .send({ username: DEFAULT_STAFF.mpro.username, password: DEFAULT_STAFF.mpro.password })

            await agentMPRO.patch(`/api/v1/reports/${report.id}/manage`)
                .send({ status: 'ASSIGNED' })

            //TOSM self-assigns
            await agentTOSM.post('/api/v1/auth/login?type=STAFF')
                .send({ username: DEFAULT_STAFF.tosm_RSTLO.username, password: DEFAULT_STAFF.tosm_RSTLO.password })
                .expect(200);

            await agentTOSM.patch(`/api/v1/reports/${report.id}/assignSelf`)
                .send({ status: 'IN_PROGRESS' });

            //TOSM assigns to EM
            await agentTOSM.patch(`/api/v1/reports/${report.id}/assignExternal`)
                .send({ staffEM: DEFAULT_STAFF.em_RSTLO.username })
                .expect(200);

            //EM logs in
            await agentEM.post('/api/v1/auth/login?type=STAFF')
                .send({ username: DEFAULT_STAFF.em_RSTLO.username, password: DEFAULT_STAFF.em_RSTLO.password })

            //EM adds a message
            const res = await agentEM.post(`/api/v1/reports/${report.id}/messages`)
                .send({ message: 'Test message from EM', isPrivate: true })
                .expect(201);
            
            expect(res.body).toBeDefined();
            expect(res.body.id).toBe(report.id);
            expect(res.body.isExternal).toBe(true);
        });
    
    });

    describe('GET /api/v1/reports/:id/messages', () => {
        it('should get all messages for a report', async () => {
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

            // Add messages using the controller/service
            const agent = request.agent(app);
            await agent.post('/api/v1/auth/login?type=CITIZEN')
                .send({ username: DEFAULT_CITIZENS.citizen1.username, password: 'cit123' })
                .expect(200);

            await agent
                .post(`/api/v1/reports/${report.id}/messages`)
                .send({ message: 'Message 1' });

            await agent
                .post(`/api/v1/reports/${report.id}/messages`)
                .send({ message: 'Message 2' });

            const response = await agent
                .get(`/api/v1/reports/${report.id}/messages`)
                .expect(200);

            expect(response.body.length).toBe(2);
        });
    });

});
