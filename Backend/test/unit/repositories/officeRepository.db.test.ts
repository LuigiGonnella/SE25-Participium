import { OfficeDAO, OfficeCategory } from "@dao/officeDAO";
import { OfficeRepository } from "@repositories/officeRepository";
import { initializeTestDataSource, closeTestDataSource, TestDataSource } from "../../setup/test-datasource";
import { beforeAllE2e, TestDataManager } from "../../e2e/lifecycle";
import AppError from "@models/errors/AppError";
import { StaffDAO } from "@models/dao/staffDAO";
import { ConflictError } from "@models/errors/ConflictError";

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
    // Don't clear default offices (both internal and external)
    // The default offices are created once in beforeAllE2e and should remain
    await TestDataSource.getRepository(StaffDAO).createQueryBuilder()
        .delete()
        .where("username NOT IN (:...usernames)", {
            usernames: ['admin', 'mpro', 'tosm_WSO', 'tosm_ABO', 'tosm_SSO', 'tosm_PLO', 'tosm_WO', 'tosm_RSTLO', 'tosm_RUFO', 'tosm_PGAPO', 'em_WSO', 'em_ABO', 'em_SSO', 'em_PLO', 'em_WO', 'em_RSTLO', 'em_RUFO', 'em_PGAPO']
        })
        .execute();
});

describe("OfficeRepository - test suite", () => {
    it("should get default offices", async () => {
        const offices = await officeRepo.getAllOffices();
        expect(offices.length).toBeGreaterThanOrEqual(17); // 9 internal + 8 external
        
        // Check that all default categories exist
        const categories = offices.map(o => o.category);
        expect(categories).toContain(OfficeCategory.MOO);
        expect(categories).toContain(OfficeCategory.WSO);
        expect(categories).toContain(OfficeCategory.RSTLO);
    });

    it("should get default office by category", async () => {
        const office = await officeRepo.getOfficeByCategory(OfficeCategory.RSTLO);
        expect(office).toBeDefined();
        expect(office?.category).toBe(OfficeCategory.RSTLO);
        expect(office?.isExternal).toBe(false);
    });

    it("should get default office by name", async () => {
        const office = await officeRepo.getOfficeByName("Municipal Organization Office");
        expect(office).toBeDefined();
        expect(office?.category).toBe(OfficeCategory.MOO);
    });

    it("should create default offices if called again (idempotent)", async () => {
        const beforeCount = (await officeRepo.getAllOffices()).length;
        
        await officeRepo.createDefaultOfficesIfNotExist();
        
        const afterCount = (await officeRepo.getAllOffices()).length;
        expect(afterCount).toBe(beforeCount); // No duplicates
    });

    it("should return null for non-existent office by id", async () => {
        const office = await officeRepo.getOfficeById(99999);
        expect(office).toBeNull();
    });

    it("should return null for non-existent office by name", async () => {
        const office = await officeRepo.getOfficeByName("NonExistent Office");
        expect(office).toBeNull();
    });
});