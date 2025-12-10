import { OfficeRepository } from "@repositories/officeRepository";
import { OfficeCategory, OfficeDAO } from "@dao/officeDAO";
import { initializeTestDataSource, closeTestDataSource, TestDataSource } from "../../setup/test-datasource";
import { OfficeController } from "@controllers/officeController";
import { Request, Response } from "express";
import { beforeAllE2e, TestDataManager } from "../../e2e/lifecycle";

let officeRepo: OfficeRepository;

beforeAll(async () => {
    await initializeTestDataSource();
    await beforeAllE2e();
    officeRepo = new OfficeRepository();
});

afterAll(async () => {
    await closeTestDataSource();
});

beforeEach(async () => {
    // Clear only non-default offices
    const allOffices = await TestDataSource.getRepository(OfficeDAO).find();
    const defaultCategories = [
        OfficeCategory.MOO,
        OfficeCategory.WSO,
        OfficeCategory.ABO,
        OfficeCategory.SSO,
        OfficeCategory.PLO,
        OfficeCategory.WO,
        OfficeCategory.RSTLO,
        OfficeCategory.RUFO,
        OfficeCategory.PGAPO
    ];
    const toDelete = allOffices.filter(o => 
        !defaultCategories.includes(o.category) || 
        (o.isExternal && !o.name.startsWith("External Company"))
    );
    await TestDataSource.getRepository(OfficeDAO).remove(toDelete);
});

describe("OfficeController - test suite", () => {
    it("tests getAllOffices - returns default offices", async () => {
        const req = { query: {} } as Request;

        const res = {
            status: jest.fn().mockReturnThis(),
            json: jest.fn(),
        } as unknown as Response;

        await OfficeController.getAllOffices(req, res);

        expect(res.status).toHaveBeenCalledWith(200);
        const callArg = (res.json as jest.Mock).mock.calls[0][0];
        expect(Array.isArray(callArg)).toBe(true);
        expect(callArg.length).toBeGreaterThanOrEqual(17); // 9 internal + 8 external
    });

    it("tests getAllOffices - includes all default categories", async () => {
        const req = { query: {} } as Request;

        const res = {
            status: jest.fn().mockReturnThis(),
            json: jest.fn(),
        } as unknown as Response;

        await OfficeController.getAllOffices(req, res);

        const offices = (res.json as jest.Mock).mock.calls[0][0];
        const categories = offices.map((o: any) => o.category);
        
        expect(categories).toContain(OfficeCategory.MOO);
        expect(categories).toContain(OfficeCategory.WSO);
        expect(categories).toContain(OfficeCategory.RSTLO);
        expect(categories).toContain(OfficeCategory.PLO);
    });
});