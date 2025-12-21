import request from "supertest";
import { app } from "@app";
import { beforeAllE2e, afterAllE2e, beforeEachE2e, DEFAULT_CITIZENS } from "@test/e2e/lifecycle";
import { TestDataSource } from "../setup/test-datasource";
import { CitizenDAO } from "@dao/citizenDAO";
import { CitizenRepository } from "@repositories/citizenRepository";
import bcrypt from "bcrypt";

// Mock email service to prevent actual email sending during tests
jest.mock("@services/emailService", () => ({
    sendVerificationEmail: jest.fn().mockResolvedValue(undefined),
    sendPasswordResetEmail: jest.fn().mockResolvedValue(undefined),
}));


describe("Citizen API E2E Tests", () => {
    let citizenRepo: CitizenRepository;
    let citizen1Cookie: string;
    let citizen2Cookie: string;
    let citizen3Cookie: string;

    beforeAll(async () => {
        await beforeAllE2e();
        citizenRepo = new CitizenRepository();

        // Login as citizen1
        const citizen1Login = await request(app)
            .post('/api/v1/auth/login?type=CITIZEN')
            .send({
                username: DEFAULT_CITIZENS.citizen1.username,
                password: DEFAULT_CITIZENS.citizen1.password,
            })
            .expect(200);
        citizen1Cookie = citizen1Login.headers['set-cookie'][0];

        // Login as citizen2
        const citizen2Login = await request(app)
            .post('/api/v1/auth/login?type=CITIZEN')
            .send({
                username: DEFAULT_CITIZENS.citizen2.username,
                password: DEFAULT_CITIZENS.citizen2.password,
            })
            .expect(200);
        citizen2Cookie = citizen2Login.headers['set-cookie'][0];

        // Login as citizen3
        const citizen3Login = await request(app)
            .post('/api/v1/auth/login?type=CITIZEN')
            .send({
                username: DEFAULT_CITIZENS.citizen3.username,
                password: DEFAULT_CITIZENS.citizen3.password,
            })
            .expect(200);
        citizen3Cookie = citizen3Login.headers['set-cookie'][0];
    });

    afterAll(async () => {
        await afterAllE2e();
    });

    beforeEach(async () => {
        await beforeEachE2e();
    });

    describe("GET /api/v1/citizens - Get all citizens", () => {
        it("should return all citizens with correct structure", async () => {
            const res = await request(app)
                .get("/api/v1/citizens");

            expect(res.status).toBe(200);
            
            // Check that default citizens are present
            const usernames = res.body.map((c: any) => c.username);
            expect(usernames).toContain(DEFAULT_CITIZENS.citizen1.username);
            expect(usernames).toContain(DEFAULT_CITIZENS.citizen2.username);
            expect(usernames).toContain(DEFAULT_CITIZENS.citizen3.username);
        });

        it("should not include password or id in returned citizens", async () => {
            const res = await request(app)
                .get("/api/v1/citizens");

            expect(res.status).toBe(200);
            expect(res.body[0]).not.toHaveProperty('password');
            expect(res.body[0]).not.toHaveProperty('id');
        });

        it("should return citizens with all expected DTO fields", async () => {
            const res = await request(app)
                .get("/api/v1/citizens");

            expect(res.status).toBe(200);
            expect(res.body[0]).toHaveProperty('email');
            expect(res.body[0]).toHaveProperty('username');
            expect(res.body[0]).toHaveProperty('name');
            expect(res.body[0]).toHaveProperty('surname');
            expect(res.body[0]).toHaveProperty('receive_emails');
        });
    });

    describe("GET /api/v1/citizens/id/:id - Get citizen by ID", () => {
        it("should return default citizen by valid ID", async () => {
            // Get a default citizen
            const allCitizens = await TestDataSource
                .getRepository(CitizenDAO)
                .find();
            
            const defaultCitizen = allCitizens.find(c => c.username === DEFAULT_CITIZENS.citizen1.username);

            const res = await request(app)
                .get(`/api/v1/citizens/id/${defaultCitizen!.id}`);

            expect(res.status).toBe(200);
            expect(res.body).toMatchObject({
                username: DEFAULT_CITIZENS.citizen1.username,
                email: DEFAULT_CITIZENS.citizen1.email,
            });
            expect(res.body).not.toHaveProperty('password');
            expect(res.body).not.toHaveProperty('id');
        });

        it("should return 200 with null body for non-existent ID", async () => {
            const res = await request(app)
                .get("/api/v1/citizens/id/9999");

            expect(res.status).toBe(200);
            expect(res.body).toBeNull();
        });

        it("should handle invalid ID parameter", async () => {
            const res = await request(app)
                .get("/api/v1/citizens/id/invalid");

            expect(res.status).toBe(400);
            expect(res.body).toHaveProperty('error');
        });
    });

    describe("GET /api/v1/citizens/email/:email - Get citizen by email", () => {
        it("should return default citizen by valid email", async () => {
            const res = await request(app)
                .get(`/api/v1/citizens/email/${DEFAULT_CITIZENS.citizen1.email}`);

            expect(res.status).toBe(200);
            expect(res.body).toMatchObject({
                email: DEFAULT_CITIZENS.citizen1.email,
                username: DEFAULT_CITIZENS.citizen1.username,
            });
            expect(res.body).not.toHaveProperty('password');
        });

        it("should return 200 with null for non-existent email", async () => {
            const res = await request(app)
                .get("/api/v1/citizens/email/nonexistent@example.com");

            expect(res.status).toBe(200);
            expect(res.body).toBeNull();
        });

        it("should handle URL-encoded email addresses", async () => {
            const encodedEmail = encodeURIComponent(DEFAULT_CITIZENS.citizen1.email);
            const res = await request(app)
                .get(`/api/v1/citizens/email/${encodedEmail}`);

            expect(res.status).toBe(200);
            expect(res.body).toMatchObject({
                email: DEFAULT_CITIZENS.citizen1.email,
            });
        });

        it("should return 400 for invalid email (missing @)", async () => {
            const res = await request(app)
                .get("/api/v1/citizens/email/invalidemail");

            expect(res.status).toBe(400);
            expect(res.body).toHaveProperty('error');
        });
    });

    describe("GET /api/v1/citizens/username/:username - Get citizen by username", () => {
        it("should return default citizen by valid username", async () => {
            const res = await request(app)
                .get(`/api/v1/citizens/username/${DEFAULT_CITIZENS.citizen2.username}`);

            expect(res.status).toBe(200);
            expect(res.body).toMatchObject({
                email: DEFAULT_CITIZENS.citizen2.email,
                username: DEFAULT_CITIZENS.citizen2.username,
            });
            expect(res.body).not.toHaveProperty('password');
        });

        it("should return 200 with null for non-existent username", async () => {
            const res = await request(app)
                .get("/api/v1/citizens/username/nonexistentuser");

            expect(res.status).toBe(200);
            expect(res.body).toBeNull();
        });

        it("should handle usernames with special characters", async () => {
            const specialUsername = "test_user.123";
            await citizenRepo.createCitizen(
                "special@test.com",
                specialUsername,
                "Test",
                "User",
                await bcrypt.hash("password123", 10),
                true,
            );

            const res = await request(app)
                .get(`/api/v1/citizens/username/${specialUsername}`);

            expect(res.status).toBe(200);
            expect(res.body).toMatchObject({
                username: specialUsername,
            });
        });
    });

    describe("PATCH /api/v1/citizens/username/:username - Update citizen", () => {
        it("should update telegram_username for default citizen", async () => {
            const res = await request(app)
                .patch(`/api/v1/citizens/${DEFAULT_CITIZENS.citizen1.username}`)
                .set('Cookie', citizen1Cookie)
                .send({ telegram_username: 'new_telegram' });
            
            expect(res.status).toBe(200);
            expect(res.body).toHaveProperty('telegram_username', 'new_telegram');
        });

        it("should update receive_emails for default citizen", async () => {
            const res = await request(app)
                .patch(`/api/v1/citizens/${DEFAULT_CITIZENS.citizen2.username}`)
                .set('Cookie', citizen2Cookie)
                .send({ receive_emails: false });
            
            expect(res.status).toBe(200);
            expect(res.body).toHaveProperty('receive_emails', false);
        });

        it("should update profilePicture for default citizen", async () => {
            const res = await request(app)
                .patch(`/api/v1/citizens/${DEFAULT_CITIZENS.citizen3.username}`)
                .set('Cookie', citizen3Cookie)
                .attach('profilePicture', Buffer.from([0x89, 0x50, 0x4E, 0x47]), 'profile.png');
            
            expect(res.status).toBe(200);
            expect(res.body).toHaveProperty('profilePicture');
            expect(res.body.profilePicture).toContain('/uploads/profiles/');
        });

        it("should return 403 when updating another citizen's profile", async () => { 
            const res = await request(app)
                .patch(`/api/v1/citizens/anotheruser`)
                .set('Cookie', citizen1Cookie)
                .send({ telegram_username: 'hacker_telegram' });
            
            expect(res.status).toBe(403);
            expect(res.body).toHaveProperty('error');
        });  
    });

    describe("Integration - Complete HTTP citizen lifecycle", () => {
        it("should retrieve default citizen by ID", async () => {
            const allCitizens = await TestDataSource
                .getRepository(CitizenDAO)
                .find();
            
            const defaultCitizen = allCitizens.find(c => c.username === DEFAULT_CITIZENS.citizen3.username);

            const res = await request(app)
                .get(`/api/v1/citizens/id/${defaultCitizen!.id}`);
            
            expect(res.status).toBe(200);
            expect(res.body.username).toBe(DEFAULT_CITIZENS.citizen3.username);
            expect(res.body.email).toBe(DEFAULT_CITIZENS.citizen3.email);
        });

        it("should retrieve default citizen by email", async () => {
            const res = await request(app)
                .get(`/api/v1/citizens/email/${DEFAULT_CITIZENS.citizen3.email}`);
            
            expect(res.status).toBe(200);
            expect(res.body.username).toBe(DEFAULT_CITIZENS.citizen3.username);
            expect(res.body.email).toBe(DEFAULT_CITIZENS.citizen3.email);
        });

        it("should retrieve default citizen by username", async () => {
            const res = await request(app)
                .get(`/api/v1/citizens/username/${DEFAULT_CITIZENS.citizen3.username}`);
            
            expect(res.status).toBe(200);
            expect(res.body.username).toBe(DEFAULT_CITIZENS.citizen3.username);
            expect(res.body.email).toBe(DEFAULT_CITIZENS.citizen3.email);
        });

        it("should maintain data consistency across email and username endpoints", async () => {
            const byEmailRes = await request(app)
                .get(`/api/v1/citizens/email/${DEFAULT_CITIZENS.citizen3.email}`);
            
            const byUsernameRes = await request(app)
                .get(`/api/v1/citizens/username/${DEFAULT_CITIZENS.citizen3.username}`);

            expect(byEmailRes.status).toBe(200);
            expect(byUsernameRes.status).toBe(200);
            expect(byEmailRes.body).toEqual(byUsernameRes.body);
        });
    });

    describe("Edge cases and error handling", () => {
        it("should handle negative IDs", async () => {
            const res = await request(app)
                .get("/api/v1/citizens/id/-1");

            expect(res.status).toBe(200);
            expect(res.body).toBeNull();
        });

        it("should handle zero as ID", async () => {
            const res = await request(app)
                .get("/api/v1/citizens/id/0");

            expect(res.status).toBe(200);
            expect(res.body).toBeNull();
        });
    });
});
