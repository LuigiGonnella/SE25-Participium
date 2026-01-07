import { Request, Response } from "express";
import { initializeTestDataSource, closeTestDataSource } from "../../setup/test-datasource";
import { beforeAllE2e, DEFAULT_STAFF } from "../../e2e/lifecycle";
import { getAllStaff, getAllEMStaff, getAllTOSM } from "@controllers/staffController";

beforeAll(async () => {
    await initializeTestDataSource();
    await beforeAllE2e();
});

afterAll(async () => {
    await closeTestDataSource();
});

beforeEach(async () => {
    return;
});

const mkRes = (): Response =>
    ({
        status: jest.fn().mockReturnThis(),
        json: jest.fn()
    } as unknown as Response);

describe("StaffController - test suite", () => {
    it("tests getAllStaff - returns staff list", async () => {
        const req = { query: {} } as unknown as Request;
        const res = mkRes();

        await getAllStaff(req, res);

        expect(res.status).toHaveBeenCalledWith(200);

        const staffs = (res.json as jest.Mock).mock.calls[0][0];
        expect(Array.isArray(staffs)).toBe(true);
        expect(staffs.length).toBeGreaterThan(0);

        const usernames = staffs.map((s: any) => s.username);
        expect(usernames).toContain(DEFAULT_STAFF.admin.username);
    });

    it("tests getAllStaff - filters by isExternal=true (by checking only EM usernames appear)", async () => {
        const req = { query: { isExternal: "true" } } as unknown as Request;
        const res = mkRes();

        await getAllStaff(req, res);

        expect(res.status).toHaveBeenCalledWith(200);

        const staffs = (res.json as jest.Mock).mock.calls[0][0];
        expect(Array.isArray(staffs)).toBe(true);

        const usernames = staffs.map((s: any) => s.username);
        expect(usernames).toContain(DEFAULT_STAFF.em_RSTLO.username);
        expect(usernames).not.toContain(DEFAULT_STAFF.tosm_RSTLO.username);
        expect(usernames).not.toContain(DEFAULT_STAFF.mpro.username);
        expect(usernames).not.toContain(DEFAULT_STAFF.admin.username);
    });

    it("tests getAllStaff - filters by isExternal=false (current behavior)", async () => {
        const req = { query: { isExternal: "false" } } as unknown as Request;
        const res = mkRes();
    
        await getAllStaff(req, res);
    
        expect(res.status).toHaveBeenCalledWith(200);
    
        const staffs = (res.json as jest.Mock).mock.calls[0][0];
        expect(Array.isArray(staffs)).toBe(true);
        expect(staffs.length).toBeGreaterThan(0);
    
        const usernames = staffs.map((s: any) => s.username);
        expect(usernames).not.toContain(DEFAULT_STAFF.admin.username);
        expect(usernames).not.toContain(DEFAULT_STAFF.mpro.username);
    });

    it("tests getAllStaff - filters by category=RSTLO (expects RSTLO TOSM + RSTLO EM, not RUFO EM)", async () => {
        const req = { query: { category: "RSTLO" } } as unknown as Request;
        const res = mkRes();

        await getAllStaff(req, res);

        expect(res.status).toHaveBeenCalledWith(200);

        const staffs = (res.json as jest.Mock).mock.calls[0][0];
        expect(Array.isArray(staffs)).toBe(true);

        const usernames = staffs.map((s: any) => s.username);
        expect(usernames).toContain(DEFAULT_STAFF.tosm_RSTLO.username);
        expect(usernames).toContain(DEFAULT_STAFF.em_RSTLO.username);
        expect(usernames).not.toContain(DEFAULT_STAFF.em_RUFO.username);
    });

    it("tests getAllStaff - invalid isExternal does not error (current behavior)", async () => {
        const req = { query: { isExternal: "invalid" } } as unknown as Request;
        const res = mkRes();

        await getAllStaff(req, res);

        expect(res.status).toHaveBeenCalledWith(200);

        const staffs = (res.json as jest.Mock).mock.calls[0][0];
        expect(Array.isArray(staffs)).toBe(true);
        expect(staffs.length).toBeGreaterThan(0);
    });

    it("tests getAllEMStaff - returns only external staff (by usernames)", async () => {
        const req = { query: {} } as unknown as Request;
        const res = mkRes();

        await getAllEMStaff(req, res);

        expect(res.status).toHaveBeenCalledWith(200);

        const staffs = (res.json as jest.Mock).mock.calls[0][0];
        expect(Array.isArray(staffs)).toBe(true);

        const usernames = staffs.map((s: any) => s.username);
        expect(usernames).toContain(DEFAULT_STAFF.em_RSTLO.username);
        expect(usernames).not.toContain(DEFAULT_STAFF.tosm_RSTLO.username);
        expect(usernames).not.toContain(DEFAULT_STAFF.admin.username);
    });

    it("tests getAllEMStaff - filters by category=RSTLO", async () => {
        const req = { query: { category: "RSTLO" } } as unknown as Request;
        const res = mkRes();

        await getAllEMStaff(req, res);

        expect(res.status).toHaveBeenCalledWith(200);

        const staffs = (res.json as jest.Mock).mock.calls[0][0];
        expect(Array.isArray(staffs)).toBe(true);

        const usernames = staffs.map((s: any) => s.username);
        expect(usernames).toContain(DEFAULT_STAFF.em_RSTLO.username);
        expect(usernames).not.toContain(DEFAULT_STAFF.em_RUFO.username);
    });

    it("tests getAllTOSM - returns TOSM staff", async () => {
        const req = { query: {} } as unknown as Request;
        const res = mkRes();

        await getAllTOSM(req, res);

        expect(res.status).toHaveBeenCalledWith(200);

        const staffs = (res.json as jest.Mock).mock.calls[0][0];
        expect(Array.isArray(staffs)).toBe(true);
        expect(staffs.length).toBeGreaterThan(0);

        const usernames = staffs.map((s: any) => s.username);
        expect(usernames).toContain(DEFAULT_STAFF.tosm_RSTLO.username);
        expect(usernames).not.toContain(DEFAULT_STAFF.em_RSTLO.username);
    });

    it("tests getAllTOSM - filters by category=RSTLO", async () => {
        const req = { query: { category: "RSTLO" } } as unknown as Request;
        const res = mkRes();

        await getAllTOSM(req, res);

        expect(res.status).toHaveBeenCalledWith(200);

        const staffs = (res.json as jest.Mock).mock.calls[0][0];
        expect(Array.isArray(staffs)).toBe(true);

        const usernames = staffs.map((s: any) => s.username);
        expect(usernames).toContain(DEFAULT_STAFF.tosm_RSTLO.username);
    });

    it("tests getAllTOSM - returns 500 on invalid category", async () => {
        const req = { query: { category: "INVALID" } } as unknown as Request;
        const res = mkRes();

        await getAllTOSM(req, res);

        expect(res.status).toHaveBeenCalledWith(500);
        expect(res.json).toHaveBeenCalledWith({ message: "Failed to fetch TOSM staff" });
    });
});