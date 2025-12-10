import { OfficeCategory } from "@dao/officeDAO";
import { beforeAllE2e, afterAllE2e, beforeEachE2e, DEFAULT_STAFF } from "@test/e2e/lifecycle";
import request from "supertest";
import { app } from "@app";

let adminCookie: string;


beforeAll(async () => {
    await beforeAllE2e();

    // Login with default admin
    const loginResponse = await request(app)
        .post('/api/v1/auth/login?type=STAFF')
        .send({
            username: DEFAULT_STAFF.admin.username,
            password: DEFAULT_STAFF.admin.password,
        })
        .expect(200);

    adminCookie = loginResponse.headers['set-cookie'][0]; 
});

afterAll(async () => {
    await afterAllE2e();
});

beforeEach(async () => {
    await beforeEachE2e();
});

describe("Office E2E Tests", () => {
    describe("GET /offices - Get all offices", () => {
        it("should return an empty array when no offices exist", async () => {
            const response = await request(app)
                .get('/api/v1/offices')
                .set('Cookie', adminCookie)
                .expect(200);

            expect(response.body).toBeDefined();
            expect(Array.isArray(response.body)).toBe(true);
            expect(response.body.length).toBe(17);
        });
        
    });
});

