import request from "supertest";
import { app } from "@app";

import {
    beforeAllE2e,
    afterAllE2e,
    beforeEachE2e,
    TEST_CITIZENS,
} from "@test/e2e/lifecycle";

import path from "path";

let authCookie: string;

beforeAll(async () => {
    await beforeAllE2e();

    // LOGIN AS SEEDED CITIZEN (citizen1 from lifecycle)
    const loginResponse = await request(app)
        .post("/api/v1/auth/login?type=CITIZEN")
        .send({
            username: TEST_CITIZENS.citizen1.username,
            password: TEST_CITIZENS.citizen1.password,
        })
        .expect(200);

    authCookie = loginResponse.headers["set-cookie"][0];
});

beforeEach(async () => {
    await beforeEachE2e();
});

afterAll(async () => {
    await afterAllE2e();
});

describe("Report Creation E2E Tests", () => {
    const sampleImage = path.join(__dirname, "sample.png"); // exists in same folder

    it("should create a report successfully", async () => {
        const res = await request(app)
            .post("/api/v1/reports")
            .set("Cookie", authCookie)
            .field("title", "Broken Streetlight")
            .field("description", "The streetlight near my house is broken")
            .field("category", "PLO")
            .field("latitude", "45.0677")
            .field("longitude", "7.6823")
            .field("anonymous", "false")
            .attach("photos", sampleImage)
            .expect(201);

        expect(res.body).toBeDefined();
        expect(res.body.title).toBe("Broken Streetlight");
        expect(res.body.photo1).toBeDefined();
        expect(res.body.photo1).toContain("/uploads/reports/");
    });

    it("should fail when required fields are missing", async () => {
        const res = await request(app)
            .post("/api/v1/reports")
            .set("Cookie", authCookie)
            .field("title", "")
            .field("description", "desc")
            .field("category", "PLO")
            .field("latitude", "45")
            .field("longitude", "7")
            .attach("photos", sampleImage)
            .expect(400);

        expect(res.body.error).toBeDefined();
        expect(res.body.error).toContain("Missing required fields");
    });

    it("should fail when no photo is uploaded", async () => {
        const res = await request(app)
            .post("/api/v1/reports")
            .set("Cookie", authCookie)
            .field("title", "Test Report")
            .field("description", "Testing")
            .field("category", "PLO")
            .field("latitude", "45")
            .field("longitude", "7")
            .field("anonymous", "false")
            .expect(400);

        expect(res.body.error).toContain("At least one photo is required");
    });

    it("should reject unauthenticated user", async () => {
        const res = await request(app)
            .post("/api/v1/reports")
            .field("title", "No Login")
            .field("description", "desc")
            .field("category", "PLO")
            .field("latitude", "45")
            .field("longitude", "7")
            .field("anonymous", "false")
            .attach("photos", sampleImage)
            .expect(401);

        expect(res.body.error).toBeDefined();
    });
});
