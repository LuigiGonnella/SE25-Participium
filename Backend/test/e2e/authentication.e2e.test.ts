import request from "supertest";
import { app } from "@app";
import { beforeAllE2e, afterAllE2e, beforeEachE2e, DEFAULT_CITIZENS } from "@test/e2e/lifecycle";
import { TestDataSource } from "../setup/test-datasource";
import { CitizenDAO } from "@dao/citizenDAO";
import bcrypt from "bcrypt";

describe("Authentication API E2E Tests", () => {
    beforeAll(async () => {
        await beforeAllE2e();
    });

    afterAll(async () => {
        await afterAllE2e();
    });

    beforeEach(async () => {
        await beforeEachE2e();
    });

    describe("POST /api/v1/auth/register - Citizen Registration", () => {
        it("should register a new citizen successfully without profile picture", async () => {
            const res = await request(app)
                .post("/api/v1/auth/register")
                .send({
                    email: "newuser@example.com",
                    username: "newuser",
                    name: "New",
                    surname: "User",
                    password: "password123",
                    receive_emails: true,
                    telegram_username: "@newuser"
                });

            expect(res.status).toBe(201);
            expect(res.body).not.toHaveProperty('email');
            expect(res.body).toHaveProperty('username', 'newuser');
            expect(res.body).toHaveProperty('name', 'New');
            expect(res.body).toHaveProperty('surname', 'User');
            expect(res.body).not.toHaveProperty('password');
            expect(res.body).not.toHaveProperty('id');

            // Verify in database
            const savedCitizen = await TestDataSource
                .getRepository(CitizenDAO)
                .findOneBy({ username: "newuser" });
            
            expect(savedCitizen).toBeTruthy();
            expect(savedCitizen?.email).toBeNull();
            expect(savedCitizen?.username).toBe("newuser");
            expect(savedCitizen?.password).not.toBe("password123"); // must be hashed
            
            // Verify password was hashed
            const isMatch = await bcrypt.compare("password123", savedCitizen!.password);
            expect(isMatch).toBe(true);
        });

        it("should fail when email already exists (using default citizen)", async () => {
            const res = await request(app)
                .post("/api/v1/auth/register")
                .send({
                    email: DEFAULT_CITIZENS.citizen1.email, 
                    username: "newusername",
                    name: "Test",
                    surname: "User",
                    password: "password123",
                    receive_emails: false
                });

            expect(res.status).toBeGreaterThanOrEqual(400);
        });

        it("should fail when username already exists (using default citizen)", async () => {
            const res = await request(app)
                .post("/api/v1/auth/register")
                .send({
                    email: "newemail@example.com",
                    username: DEFAULT_CITIZENS.citizen1.username, 
                    name: "User",
                    surname: "Two",
                    password: "password123"
                });

            expect(res.status).toBeGreaterThanOrEqual(400);
        });

        it("should hash password before saving", async () => {
            const plainPassword = "mySecretPassword123";
            
            await request(app)
                .post("/api/v1/auth/register")
                .send({
                    email: "hashtest@example.com",
                    username: "hashuser",
                    name: "Hash",
                    surname: "Test",
                    password: plainPassword,
                    receive_emails: true
                });

            const savedCitizen = await TestDataSource
                .getRepository(CitizenDAO)
                .findOneBy({ email: "hashtest@example.com" });

            expect(savedCitizen).toBeTruthy();
            expect(savedCitizen?.password).not.toBe(plainPassword);
            expect(savedCitizen?.password.length).toBeGreaterThan(20); // bcrypt hashes are long
            
            const isMatch = await bcrypt.compare(plainPassword, savedCitizen!.password);
            expect(isMatch).toBe(true);
        });

        it("should allow registration without optional fields", async () => {
            const res = await request(app)
                .post("/api/v1/auth/register")
                .send({
                    email: "minimal@example.com",
                    username: "minimaluser",
                    name: "Minimal",
                    surname: "User",
                    password: "password123"
                });

            expect(res.status).toBe(201);
            expect(res.body.email).toBe("minimal@example.com");
        });

        it("should return 400 when email is missing", async () => {
            const res = await request(app)
                .post("/api/v1/auth/register")
                .send({
                    username: "testuser",
                    name: "Test",
                    surname: "User",
                    password: "password123"
                });

            expect(res.status).toBe(400);
            expect(res.body).toHaveProperty('error');
        });

        it("should return 400 when email is invalid", async () => {
            const res = await request(app)
                .post("/api/v1/auth/register")
                .send({
                    email: "invalidemail",
                    username: "testuser",
                    name: "Test",
                    surname: "User",
                    password: "password123"
                });

            expect(res.status).toBe(400);
            expect(res.body).toHaveProperty('error');
        });

        it("should return 400 when username is missing", async () => {
            const res = await request(app)
                .post("/api/v1/auth/register")
                .send({
                    email: "test@example.com",
                    name: "Test",
                    surname: "User",
                    password: "password123"
                });

            expect(res.status).toBe(400);
            expect(res.body).toHaveProperty('error');
        });

        it("should return 400 when name is missing", async () => {
            const res = await request(app)
                .post("/api/v1/auth/register")
                .send({
                    email: "test@example.com",
                    username: "testuser",
                    surname: "User",
                    password: "password123"
                });

            expect(res.status).toBe(400);
            expect(res.body).toHaveProperty('error');
        });

        it("should return 400 when surname is missing", async () => {
            const res = await request(app)
                .post("/api/v1/auth/register")
                .send({
                    email: "test@example.com",
                    username: "testuser",
                    name: "Test",
                    password: "password123"
                });

            expect(res.status).toBe(400);
            expect(res.body).toHaveProperty('error');
        });

        it("should return 400 when password is missing", async () => {
            const res = await request(app)
                .post("/api/v1/auth/register")
                .send({
                    email: "test@example.com",
                    username: "testuser",
                    name: "Test",
                    surname: "User"
                });

            expect(res.status).toBe(400);
            expect(res.body).toHaveProperty('error');
        });
    });

    describe("POST /api/v1/auth/login - Citizen Login", () => {
        it("should login successfully with correct credentials", async () => {
            const res = await request(app)
                .post("/api/v1/auth/login?type=CITIZEN")
                .send({
                    username: DEFAULT_CITIZENS.citizen1.username,
                    password: DEFAULT_CITIZENS.citizen1.password
                });

            expect(res.status).toBe(200);
            expect(res.body).toHaveProperty('username', DEFAULT_CITIZENS.citizen1.username);
            expect(res.body).toHaveProperty('email', DEFAULT_CITIZENS.citizen1.email);
            expect(res.body).not.toHaveProperty('password');
        });

        it("should fail login with incorrect password", async () => {
            const res = await request(app)
                .post("/api/v1/auth/login?type=CITIZEN")
                .send({
                    username: DEFAULT_CITIZENS.citizen1.username,
                    password: "wrongpassword"
                });

            expect(res.status).toBe(401);
        });

        it("should fail login with non-existent username", async () => {
            const res = await request(app)
                .post("/api/v1/auth/login?type=CITIZEN")
                .send({
                    username: "nonexistent",
                    password: "somepassword"
                });

            expect(res.status).toBe(401);
        });

        it("should fail login without type query parameter", async () => {
            const res = await request(app)
                .post("/api/v1/auth/login")
                .send({
                    username: DEFAULT_CITIZENS.citizen1.username,
                    password: DEFAULT_CITIZENS.citizen1.password
                });

            expect(res.status).toBeGreaterThanOrEqual(400);
        });

        it("should fail login with invalid type query parameter", async () => {
            const res = await request(app)
                .post("/api/v1/auth/login?type=INVALID")
                .send({
                    username: DEFAULT_CITIZENS.citizen1.username,
                    password: DEFAULT_CITIZENS.citizen1.password
                });

            expect(res.status).toBeGreaterThanOrEqual(400);
        });

        it("should return 400 when username is missing", async () => {
            const res = await request(app)
                .post("/api/v1/auth/login?type=CITIZEN")
                .send({
                    password: "testpassword123"
                });

            expect(res.status).toBe(400);
            expect(res.body).toHaveProperty('error');
        });

        it("should return 400 when password is missing", async () => {
            const res = await request(app)
                .post("/api/v1/auth/login?type=CITIZEN")
                .send({
                    username: DEFAULT_CITIZENS.citizen1.username
                });

            expect(res.status).toBe(400);
            expect(res.body).toHaveProperty('error');
        });

        it("should return 400 when both username and password are missing", async () => {
            const res = await request(app)
                .post("/api/v1/auth/login?type=CITIZEN")
                .send({});

            expect(res.status).toBe(400);
            expect(res.body).toHaveProperty('error');
        });
    });

    describe("DELETE /api/v1/auth/logout - Logout", () => {
        it("should logout successfully", async () => {
            // Login with default citizen
            const loginRes = await request(app)
                .post("/api/v1/auth/login?type=CITIZEN")
                .send({
                    username: DEFAULT_CITIZENS.citizen2.username,
                    password: DEFAULT_CITIZENS.citizen2.password
                });

            const cookies = loginRes.headers['set-cookie'];

            const res = await request(app)
                .delete("/api/v1/auth/logout")
                .set('Cookie', cookies);

            expect(res.status).toBe(204);
        });

        it("should handle logout without being logged in", async () => {
            const res = await request(app)
                .delete("/api/v1/auth/logout");

            // Should still succeed (no error for logging out when not logged in)
            expect(res.status).toBe(204);
        });
    });

    describe("GET /api/v1/auth/me - Get current user", () => {
        it("should return current user when authenticated", async () => {
            // Login with default citizen
            const loginRes = await request(app)
                .post("/api/v1/auth/login?type=CITIZEN")
                .send({
                    username: DEFAULT_CITIZENS.citizen3.username,
                    password: DEFAULT_CITIZENS.citizen3.password
                });

            const cookies = loginRes.headers['set-cookie'];

            const res = await request(app)
                .get("/api/v1/auth/me")
                .set('Cookie', cookies);

            expect(res.status).toBe(200);
            expect(res.body).toHaveProperty('username', DEFAULT_CITIZENS.citizen3.username);
            expect(res.body).toHaveProperty('email', DEFAULT_CITIZENS.citizen3.email);
            expect(res.body).not.toHaveProperty('password');
        });
        
        it("should fail when not authenticated", async () => {
            const res = await request(app)
                .get("/api/v1/auth/me");

            expect(res.status).toBeGreaterThanOrEqual(401);
        });
    });
});
