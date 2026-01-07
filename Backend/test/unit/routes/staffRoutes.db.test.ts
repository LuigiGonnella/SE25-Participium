import request from "supertest";
import express, { Express } from "express";
import session from "express-session";
import passport from "passport";

import staffRoutes from "@routes/staffRoutes";
import authRoutes from "@routes/authRoutes";
import { configurePassport } from "@config/passport";
import { errorHandler } from "@middlewares/errorMiddleware";
import {
  initializeTestDataSource,
  closeTestDataSource,
  TestDataSource,
} from "../../setup/test-datasource";
import { beforeAllE2e, DEFAULT_STAFF } from "../../e2e/lifecycle";
import { StaffDAO } from "@dao/staffDAO";

let app: Express;

type Agent = ReturnType<typeof request.agent>;

async function loginStaff(agent: Agent, username: string, password: string) {
  await agent
    .post("/api/v1/auth/login?type=STAFF")
    .send({ username, password })
    .expect(200);
}

beforeAll(async () => {
  await initializeTestDataSource();
  await beforeAllE2e();

  app = express();
  app.use(express.json());

  app.use(
    session({
      secret: "test-secret",
      resave: false,
      saveUninitialized: false,
      cookie: { secure: false },
    })
  );

  app.use(passport.initialize());
  app.use(passport.session());
  configurePassport();

  app.use("/api/v1/auth", authRoutes);
  app.use("/api/v1/staffs", staffRoutes);
  app.use(errorHandler);
});

afterAll(async () => {
  await closeTestDataSource();
});

beforeEach(async () => {
  const allStaff = await TestDataSource.getRepository(StaffDAO).find();
  const defaultUsernames = new Set(Object.values(DEFAULT_STAFF).map((s: any) => s.username));
  const toDelete = allStaff.filter((s: any) => !defaultUsernames.has(s.username));
  if (toDelete.length > 0) {
    await TestDataSource.getRepository(StaffDAO).remove(toDelete);
  }
});

describe("Staff Routes Tests", () => {
  describe("GET /api/v1/staffs", () => {
    it("should return 401 when not authenticated", async () => {
      await request(app).get("/api/v1/staffs").expect(401);
    });

    it("should return 403 when authenticated as non-admin staff", async () => {
      const agent = request.agent(app);
      await loginStaff(agent, DEFAULT_STAFF.tosm_RSTLO.username, "tosm123");
      const res = await agent.get("/api/v1/staffs").expect(403);
      expect(res.body).toHaveProperty('message');
    });

    it("should return staff list when authenticated as admin", async () => {
      const agent = request.agent(app);
      await loginStaff(agent, DEFAULT_STAFF.admin.username, "admin123");

      const res = await agent.get("/api/v1/staffs").expect(200);

      expect(Array.isArray(res.body)).toBe(true);
      expect(res.body.length).toBeGreaterThan(0);

      const usernames = res.body.map((s: any) => s.username);
      expect(usernames).toContain(DEFAULT_STAFF.admin.username);
      expect(usernames).toContain(DEFAULT_STAFF.mpro.username);
    });

    it("should accept query params isExternal and category without crashing (admin)", async () => {
      const agent = request.agent(app);
      await loginStaff(agent, DEFAULT_STAFF.admin.username, "admin123");

      const res = await agent.get("/api/v1/staffs?isExternal=true&category=RSTLO").expect(200);

      expect(Array.isArray(res.body)).toBe(true);
      expect(res.body.length).toBeGreaterThan(0);
    });
  });

  describe("GET /api/v1/staffs/external", () => {
    it("should return 401 when not authenticated", async () => {
      await request(app).get("/api/v1/staffs/external").expect(401);
    });

    it("should return 403 when authenticated as admin (wrong role)", async () => {
      const agent = request.agent(app);
      await loginStaff(agent, DEFAULT_STAFF.admin.username, "admin123");
      const res = await agent.get("/api/v1/staffs/external").expect(403);
      expect(res.body).toHaveProperty('message');
    });

    it("should return external staff list when authenticated as TOSM", async () => {
      const agent = request.agent(app);
      await loginStaff(agent, DEFAULT_STAFF.tosm_RSTLO.username, "tosm123");

      const res = await agent.get("/api/v1/staffs/external").expect(200);

      expect(Array.isArray(res.body)).toBe(true);
      expect(res.body.length).toBeGreaterThan(0);

      const usernames = res.body.map((s: any) => s.username);
      expect(usernames).toContain(DEFAULT_STAFF.em_RSTLO.username);
    });

    it("should accept category filter (TOSM)", async () => {
      const agent = request.agent(app);
      await loginStaff(agent, DEFAULT_STAFF.tosm_RSTLO.username, "tosm123");

      const res = await agent.get("/api/v1/staffs/external?category=RSTLO").expect(200);

      expect(Array.isArray(res.body)).toBe(true);
      expect(res.body.length).toBeGreaterThan(0);
    });
  });

  describe("GET /api/v1/staffs/tosm", () => {
    it("should return 401 when not authenticated", async () => {
      await request(app).get("/api/v1/staffs/tosm").expect(401);
    });

    it("should return 403 when authenticated as TOSM (wrong role)", async () => {
      const agent = request.agent(app);
      await loginStaff(agent, DEFAULT_STAFF.tosm_RSTLO.username, "tosm123");
      const res = await agent.get("/api/v1/staffs/tosm").expect(403);
      expect(res.body).toHaveProperty('message');
    });

    it("should return TOSM list when authenticated as admin", async () => {
      const agent = request.agent(app);
      await loginStaff(agent, DEFAULT_STAFF.admin.username, "admin123");

      const res = await agent.get("/api/v1/staffs/tosm").expect(200);

      expect(Array.isArray(res.body)).toBe(true);
      expect(res.body.length).toBeGreaterThan(0);

      const usernames = res.body.map((s: any) => s.username);
      expect(usernames).toContain(DEFAULT_STAFF.tosm_RSTLO.username);
    });

    it("should accept category filter (admin)", async () => {
      const agent = request.agent(app);
      await loginStaff(agent, DEFAULT_STAFF.admin.username, "admin123");

      const res = await agent.get("/api/v1/staffs/tosm?category=RSTLO").expect(200);

      expect(Array.isArray(res.body)).toBe(true);
      expect(res.body.length).toBeGreaterThan(0);
    });
  });

  describe("PATCH /api/v1/staffs/:username/offices", () => {
    it("should return 401 when not authenticated", async () => {
      await request(app)
        .patch(`/api/v1/staffs/${DEFAULT_STAFF.tosm_RSTLO.username}/offices`)
        .expect(401);
    });

    it("should return 403 when authenticated as non-admin staff", async () => {
      const agent = request.agent(app);
      await loginStaff(agent, DEFAULT_STAFF.tosm_RSTLO.username, "tosm123");

      const res = await agent
        .patch(`/api/v1/staffs/${DEFAULT_STAFF.tosm_RSTLO.username}/offices`)
        .send({ offices: ["RSTLO"] })
        .expect(403);
        expect(res.body).toHaveProperty('message');
    });

    it("should reach controller when authenticated as admin (does not return 401/403)", async () => {
      const agent = request.agent(app);
      await loginStaff(agent, DEFAULT_STAFF.admin.username, "admin123");

      const res = await agent
        .patch(`/api/v1/staffs/${DEFAULT_STAFF.tosm_RSTLO.username}/offices`)
        .send({ offices: ["RSTLO"] });

      expect([401, 403]).not.toContain(res.status);
      expect(res.body).toHaveProperty('message');
    });
  });
});