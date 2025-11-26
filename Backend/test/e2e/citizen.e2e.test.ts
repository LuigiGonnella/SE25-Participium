import request from "supertest";
import { app } from "@app";
import { beforeAllE2e, afterAllE2e, TEST_CITIZENS } from "@test/e2e/lifecycle";
import { TestDataSource } from "../setup/test-datasource";
import { CitizenDAO } from "@dao/citizenDAO";
import { CitizenRepository } from "@repositories/citizenRepository";
import bcrypt from "bcrypt";

describe("Citizen API E2E Tests", () => {
    let citizenRepo: CitizenRepository;

    beforeAll(async () => {
        await beforeAllE2e();
        citizenRepo = new CitizenRepository();
    });

    afterAll(async () => {
        await afterAllE2e();
    });

    beforeEach(async () => {
        await TestDataSource.getRepository(CitizenDAO).clear();
    });

    describe("GET /api/v1/citizens - Get all citizens", () => {
        it("should return empty array when no citizens exist", async () => {
            const res = await request(app)
                .get("/api/v1/citizens");

            expect(res.status).toBe(200);
            expect(res.body).toEqual([]);
        });

        it("should return all citizens with correct structure", async () => {
            // Create test citizens
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

            const res = await request(app)
                .get("/api/v1/citizens");

            expect(res.status).toBe(200);
            expect(res.body).toHaveLength(2);
            
            // Check first citizen
            expect(res.body[0]).toMatchObject({
                email: TEST_CITIZENS.citizen1.email,
                username: TEST_CITIZENS.citizen1.username,
                name: TEST_CITIZENS.citizen1.name,
                surname: TEST_CITIZENS.citizen1.surname,
            });

            // Check second citizen
            expect(res.body[1]).toMatchObject({
                email: TEST_CITIZENS.citizen2.email,
                username: TEST_CITIZENS.citizen2.username,
                name: TEST_CITIZENS.citizen2.name,
                surname: TEST_CITIZENS.citizen2.surname,
            });
        });

        it("should not include password or id in returned citizens", async () => {
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

            const res = await request(app)
                .get("/api/v1/citizens");

            expect(res.status).toBe(200);
            expect(res.body[0]).not.toHaveProperty('password');
            expect(res.body[0]).not.toHaveProperty('id');
        });

        it("should return citizens with all expected DTO fields", async () => {
            await citizenRepo.createCitizen(
                TEST_CITIZENS.citizen3.email,
                TEST_CITIZENS.citizen3.username,
                TEST_CITIZENS.citizen3.name,
                TEST_CITIZENS.citizen3.surname,
                await bcrypt.hash(TEST_CITIZENS.citizen3.password, 10),
                TEST_CITIZENS.citizen3.receive_emails,
                TEST_CITIZENS.citizen3.profilePicture,
                TEST_CITIZENS.citizen3.telegram_username
            );

            const res = await request(app)
                .get("/api/v1/citizens");

            expect(res.status).toBe(200);
            expect(res.body[0]).toHaveProperty('email');
            expect(res.body[0]).toHaveProperty('username');
            expect(res.body[0]).toHaveProperty('name');
            expect(res.body[0]).toHaveProperty('surname');
            expect(res.body[0]).toHaveProperty('receive_emails');
            expect(res.body[0]).toHaveProperty('profilePicture');
            expect(res.body[0]).toHaveProperty('telegram_username');
        });
    });

    describe("GET /api/v1/citizens/id/:id - Get citizen by ID", () => {
        it("should return citizen by valid ID", async () => {
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

            const savedCitizen = await TestDataSource
                .getRepository(CitizenDAO)
                .findOneBy({ email: TEST_CITIZENS.citizen1.email });

            const res = await request(app)
                .get(`/api/v1/citizens/id/${savedCitizen!.id}`);

            expect(res.status).toBe(200);
            expect(res.body).toMatchObject({
                email: TEST_CITIZENS.citizen1.email,
                username: TEST_CITIZENS.citizen1.username,
                name: TEST_CITIZENS.citizen1.name,
                surname: TEST_CITIZENS.citizen1.surname,
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

        it("should return correct citizen when multiple citizens exist", async () => {
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

            const savedCitizen2 = await TestDataSource
                .getRepository(CitizenDAO)
                .findOneBy({ email: TEST_CITIZENS.citizen2.email });

            const res = await request(app)
                .get(`/api/v1/citizens/id/${savedCitizen2!.id}`);

            expect(res.status).toBe(200);
            expect(res.body).toMatchObject({
                email: TEST_CITIZENS.citizen2.email,
                username: TEST_CITIZENS.citizen2.username,
            });
        });

        it("should handle invalid ID parameter", async () => {
            const res = await request(app)
                .get("/api/v1/citizens/id/invalid");

            expect(res.status).toBe(400);
            expect(res.body).toHaveProperty('error');
        });
    });

    describe("GET /api/v1/citizens/email/:email - Get citizen by email", () => {
        it("should return citizen by valid email", async () => {
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

            const res = await request(app)
                .get(`/api/v1/citizens/email/${TEST_CITIZENS.citizen1.email}`);

            expect(res.status).toBe(200);
            expect(res.body).toMatchObject({
                email: TEST_CITIZENS.citizen1.email,
                username: TEST_CITIZENS.citizen1.username,
                name: TEST_CITIZENS.citizen1.name,
                surname: TEST_CITIZENS.citizen1.surname,
            });
            expect(res.body).not.toHaveProperty('password');
        });

        it("should return 200 with null for non-existent email", async () => {
            const res = await request(app)
                .get("/api/v1/citizens/email/nonexistent@example.com");

            expect(res.status).toBe(200);
            expect(res.body).toBeNull();
        });

        it("should return complete citizen DTO with all fields", async () => {
            await citizenRepo.createCitizen(
                TEST_CITIZENS.citizen3.email,
                TEST_CITIZENS.citizen3.username,
                TEST_CITIZENS.citizen3.name,
                TEST_CITIZENS.citizen3.surname,
                await bcrypt.hash(TEST_CITIZENS.citizen3.password, 10),
                TEST_CITIZENS.citizen3.receive_emails,
                TEST_CITIZENS.citizen3.profilePicture,
                TEST_CITIZENS.citizen3.telegram_username
            );

            const res = await request(app)
                .get(`/api/v1/citizens/email/${TEST_CITIZENS.citizen3.email}`);

            expect(res.status).toBe(200);
            expect(res.body).toHaveProperty('email', TEST_CITIZENS.citizen3.email);
            expect(res.body).toHaveProperty('username', TEST_CITIZENS.citizen3.username);
            expect(res.body).toHaveProperty('name', TEST_CITIZENS.citizen3.name);
            expect(res.body).toHaveProperty('surname', TEST_CITIZENS.citizen3.surname);
            expect(res.body).toHaveProperty('receive_emails', TEST_CITIZENS.citizen3.receive_emails);
            expect(res.body).toHaveProperty('profilePicture', TEST_CITIZENS.citizen3.profilePicture);
            expect(res.body).toHaveProperty('telegram_username', TEST_CITIZENS.citizen3.telegram_username);
        });

        it("should handle URL-encoded email addresses", async () => {
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

            const encodedEmail = encodeURIComponent(TEST_CITIZENS.citizen1.email);
            const res = await request(app)
                .get(`/api/v1/citizens/email/${encodedEmail}`);

            expect(res.status).toBe(200);
            expect(res.body).toMatchObject({
                email: TEST_CITIZENS.citizen1.email,
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
        it("should return citizen by valid username", async () => {
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

            const res = await request(app)
                .get(`/api/v1/citizens/username/${TEST_CITIZENS.citizen1.username}`);

            expect(res.status).toBe(200);
            expect(res.body).toMatchObject({
                email: TEST_CITIZENS.citizen1.email,
                username: TEST_CITIZENS.citizen1.username,
                name: TEST_CITIZENS.citizen1.name,
                surname: TEST_CITIZENS.citizen1.surname,
            });
            expect(res.body).not.toHaveProperty('password');
        });

        it("should return 200 with null for non-existent username", async () => {
            const res = await request(app)
                .get("/api/v1/citizens/username/nonexistentuser");

            expect(res.status).toBe(200);
            expect(res.body).toBeNull();
        });

        it("should return correct citizen when multiple exist", async () => {
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

            const res = await request(app)
                .get(`/api/v1/citizens/username/${TEST_CITIZENS.citizen2.username}`);

            expect(res.status).toBe(200);
            expect(res.body).toMatchObject({
                email: TEST_CITIZENS.citizen2.email,
                username: TEST_CITIZENS.citizen2.username,
            });
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
                undefined,
                undefined
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
        it("should update telegram_username", async () => {
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
            const res = await request(app)
                .patch(`/api/v1/citizens/${TEST_CITIZENS.citizen1.username}`)
                .send({ telegram_username: 'new_telegram' });
        });
        it("should update receive_emails", async () => {
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
            const res = await request(app)
                .patch(`/api/v1/citizens/${TEST_CITIZENS.citizen1.username}`)
                .send({ receive_emails: false });
        });
        it("should update profilePicture", async () => {
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
            const res = await request(app)
                .patch(`/api/v1/citizens/${TEST_CITIZENS.citizen1.username}`)
                .attach('profilePicture', Buffer.from([0x89, 0x50, 0x4E, 0x47]), 'profile.png');
        });
        it("should return 403 when updating another citizen's profile", async () => { 
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
            const res = await request(app)
                .patch(`/api/v1/citizens/anotheruser`)
                .send({ telegram_username: 'hacker_telegram' });
        });  
    });

    describe("Integration - Complete HTTP citizen lifecycle", () => {
        it("should retrieve same citizen data through different endpoints", async () => {
            const hashedPassword = await bcrypt.hash(TEST_CITIZENS.citizen1.password, 10);
            const createdCitizen = await citizenRepo.createCitizen(
                TEST_CITIZENS.citizen1.email,
                TEST_CITIZENS.citizen1.username,
                TEST_CITIZENS.citizen1.name,
                TEST_CITIZENS.citizen1.surname,
                hashedPassword,
                TEST_CITIZENS.citizen1.receive_emails,
                TEST_CITIZENS.citizen1.profilePicture,
                TEST_CITIZENS.citizen1.telegram_username
            );

            // Get by ID
            const byIdRes = await request(app)
                .get(`/api/v1/citizens/id/${createdCitizen.id}`);
            expect(byIdRes.status).toBe(200);
            expect(byIdRes.body.username).toBe(TEST_CITIZENS.citizen1.username);

            // Get by email
            const byEmailRes = await request(app)
                .get(`/api/v1/citizens/email/${TEST_CITIZENS.citizen1.email}`);
            expect(byEmailRes.status).toBe(200);
            expect(byEmailRes.body.username).toBe(TEST_CITIZENS.citizen1.username);

            // Get by username
            const byUsernameRes = await request(app)
                .get(`/api/v1/citizens/username/${TEST_CITIZENS.citizen1.username}`);
            expect(byUsernameRes.status).toBe(200);
            expect(byUsernameRes.body.email).toBe(TEST_CITIZENS.citizen1.email);

            // Get all
            const allRes = await request(app)
                .get("/api/v1/citizens");
            expect(allRes.status).toBe(200);
            expect(allRes.body).toHaveLength(1);
            expect(allRes.body[0].username).toBe(TEST_CITIZENS.citizen1.username);
        });

        it("should maintain data consistency across all retrieval endpoints", async () => {
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

            const byEmailRes = await request(app)
                .get(`/api/v1/citizens/email/${TEST_CITIZENS.citizen2.email}`);
            
            const byUsernameRes = await request(app)
                .get(`/api/v1/citizens/username/${TEST_CITIZENS.citizen2.username}`);

            expect(byEmailRes.body).toEqual(byUsernameRes.body);
        });
    });

    describe("Edge cases and error handling", () => {
        it("should handle requests to empty database gracefully", async () => {
            const allRes = await request(app).get("/api/v1/citizens");
            const byIdRes = await request(app).get("/api/v1/citizens/id/1");
            const byEmailRes = await request(app).get("/api/v1/citizens/email/test@test.com");
            const byUsernameRes = await request(app).get("/api/v1/citizens/username/testuser");

            expect(allRes.status).toBe(200);
            expect(allRes.body).toEqual([]);
            
            expect(byIdRes.status).toBe(200);
            expect(byIdRes.body).toBeNull();
            
            expect(byEmailRes.status).toBe(200);
            expect(byEmailRes.body).toBeNull();
            
            expect(byUsernameRes.status).toBe(200);
            expect(byUsernameRes.body).toBeNull();
        });

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
