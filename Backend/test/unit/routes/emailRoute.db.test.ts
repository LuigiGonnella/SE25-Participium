import request from "supertest";
import express, { Express } from "express";
import authRoutes from "@routes/authRoutes";
import { initializeTestDataSource, closeTestDataSource, TestDataSource } from "../../setup/test-datasource";
import { beforeAllE2e, DEFAULT_CITIZENS, TestDataManager } from "../../e2e/lifecycle";
import { PendingVerificationRepository } from "@repositories/pendingVerificationRepository";
import { CitizenDAO } from "@dao/citizenDAO";

let app: Express;
let pvRepo: PendingVerificationRepository;

beforeAll(async () => {
    await initializeTestDataSource();
    await beforeAllE2e();

    pvRepo = new PendingVerificationRepository();

    app = express();
    app.use(express.json());
    app.use('/api/v1/auth', authRoutes);

    app.use((err: any, req: any, res: any, next: any) => {
        const status = err.status || 400;
        res.status(status).json({ error: err.message });
    });
});
afterAll(async () => {
    await closeTestDataSource();
});


describe("AuthRoutes - /verify-email", () => {
    
    it("should return 400 when code is missing", async () => {
        const res = await request(app)
            .post('/api/v1/auth/verify-email')
            .send({ code: "" })
            .expect(400);

        expect(res.body).toHaveProperty("error");
    });

    it("should verify email successfully", async () => {
        const citizen = await TestDataManager.getCitizen("citizen1");

        const pending = await pvRepo.createPendingVerification(
            citizen,
            "verified@example.com",
            "email"
        );

        const res = await request(app)
            .post('/api/v1/auth/verify-email')
            .send({ code: pending.verificationCode })
            .expect(200);

        expect(res.body).toEqual({ message: "Email verified successfully" });

        const updated = await TestDataManager.getCitizen("citizen1");
        expect(updated.email).toBe("verified@example.com");
    });

    it("should return 404 when code is invalid", async () => {
        const res = await request(app)
            .post('/api/v1/auth/verify-email')
            .send({ code: "NOTREALCODE" })
            .expect(404);
    
        expect(res.body).toHaveProperty("error");
    });
});