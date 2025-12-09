import request from 'supertest';
import express, { Express } from 'express';
import citizenRoutes from '@routes/citizenRoutes';
import { beforeAllE2e, DEFAULT_CITIZENS, TestDataManager } from "../../e2e/lifecycle";
import { initializeTestDataSource, closeTestDataSource, TestDataSource } from "../../setup/test-datasource";
import { CitizenDAO } from '@dao/citizenDAO';

let app: Express;

beforeAll(async () => {
    await initializeTestDataSource();
    await beforeAllE2e();
    
    app = express();
    app.use(express.json());
    app.use('/api/v1/citizens', citizenRoutes);
});

afterAll(async () => {
    await closeTestDataSource();
});

beforeEach(async () => {
    // Clear only non-default citizens
    const allCitizens = await TestDataSource.getRepository(CitizenDAO).find();
    const defaultUsernames = Object.values(DEFAULT_CITIZENS).map(c => c.username);
    const toDelete = allCitizens.filter(c => !defaultUsernames.includes(c.username));
    await TestDataSource.getRepository(CitizenDAO).remove(toDelete);
});

describe('Citizen Routes Tests', () => {
    describe('GET /api/v1/citizens', () => {
        it('should return all default citizens', async () => {
            const response = await request(app)
                .get('/api/v1/citizens')
                .expect(200);

            expect(Array.isArray(response.body)).toBe(true);
            expect(response.body.length).toBeGreaterThanOrEqual(3);
            
            const usernames = response.body.map((c: any) => c.username);
            expect(usernames).toContain(DEFAULT_CITIZENS.citizen1.username);
            expect(usernames).toContain(DEFAULT_CITIZENS.citizen2.username);
            expect(usernames).toContain(DEFAULT_CITIZENS.citizen3.username);
        });

        it('should not include password in response', async () => {
            const response = await request(app)
                .get('/api/v1/citizens')
                .expect(200);

            response.body.forEach((citizen: any) => {
                expect(citizen).not.toHaveProperty('password');
                expect(citizen).not.toHaveProperty('id');
            });
        });
    });

    describe('GET /api/v1/citizens/username/:username', () => {
        it('should return default citizen by username', async () => {
            const response = await request(app)
                .get(`/api/v1/citizens/username/${DEFAULT_CITIZENS.citizen1.username}`)
                .expect(200);

            expect(response.body).toMatchObject({
                username: DEFAULT_CITIZENS.citizen1.username,
                email: DEFAULT_CITIZENS.citizen1.email,
                name: DEFAULT_CITIZENS.citizen1.name,
                surname: DEFAULT_CITIZENS.citizen1.surname
            });
            expect(response.body).not.toHaveProperty('password');
        });

        it('should return 200 with null for non-existent username', async () => {
            const response = await request(app)
                .get('/api/v1/citizens/username/nonexistent')
                .expect(200);

            expect(response.body).toBeNull();
        });
    });

    describe('GET /api/v1/citizens/email/:email', () => {
        it('should return default citizen by email', async () => {
            const response = await request(app)
                .get(`/api/v1/citizens/email/${DEFAULT_CITIZENS.citizen2.email}`)
                .expect(200);

            expect(response.body).toMatchObject({
                username: DEFAULT_CITIZENS.citizen2.username,
                email: DEFAULT_CITIZENS.citizen2.email
            });
        });

        it('should return 200 with null for non-existent email', async () => {
            const response = await request(app)
                .get('/api/v1/citizens/email/nonexistent@example.com')
                .expect(200);

            expect(response.body).toBeNull();
        });

        it('should return 400 for invalid email format', async () => {
            const response = await request(app)
                .get('/api/v1/citizens/email/invalidemail')
                .expect(400);

            expect(response.body).toHaveProperty('error');
        });
    });

    describe('GET /api/v1/citizens/id/:id', () => {
        it('should return default citizen by id', async () => {
            const citizenDAO = await TestDataManager.getCitizen('citizen3');
            
            const response = await request(app)
                .get(`/api/v1/citizens/id/${citizenDAO.id}`)
                .expect(200);

            expect(response.body).toMatchObject({
                username: DEFAULT_CITIZENS.citizen3.username,
                email: DEFAULT_CITIZENS.citizen3.email
            });
        });

        it('should return 200 with null for non-existent id', async () => {
            const response = await request(app)
                .get('/api/v1/citizens/id/99999')
                .expect(200);

            expect(response.body).toBeNull();
        });

        it('should return 400 for invalid id format', async () => {
            const response = await request(app)
                .get('/api/v1/citizens/id/invalid')
                .expect(400);

            expect(response.body).toHaveProperty('error');
        });
    });

    describe('PATCH /api/v1/citizens/:username', () => {
        it('should update default citizen profile', async () => {
            const response = await request(app)
                .patch(`/api/v1/citizens/${DEFAULT_CITIZENS.citizen1.username}`)
                .send({
                    telegram_username: '@updated_telegram',
                    receive_emails: true
                })
                .expect(200);

            expect(response.body).toMatchObject({
                telegram_username: '@updated_telegram',
                receive_emails: true
            });

            // Reset
            await request(app)
                .patch(`/api/v1/citizens/${DEFAULT_CITIZENS.citizen1.username}`)
                .send({
                    telegram_username: '',
                    receive_emails: false
                });
        });

        it('should return 404 for non-existent username', async () => {
            const response = await request(app)
                .patch('/api/v1/citizens/nonexistent')
                .send({
                    telegram_username: '@test'
                })
                .expect(404);

            expect(response.body).toHaveProperty('message');
        });
    });
});