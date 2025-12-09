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
        !defaultCategories.includes(o.category) || o.isExternal
    );
    await TestDataSource.getRepository(OfficeDAO).remove(toDelete);
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

    it("should create a new custom office", async () => {
        const newOffice = await officeRepo.createOffice(
            "Custom Office",
            "A custom test office",
            OfficeCategory.WSO
        );
        expect(newOffice).toBeDefined();
        expect(newOffice.name).toBe("Custom Office");
        expect(newOffice.category).toBe(OfficeCategory.WSO);
    });

    it("should update an existing default office", async () => {
        const office = await TestDataManager.getOffice(OfficeCategory.PLO);
        
        const updatedOffice = await officeRepo.updateOffice(
            office.id,
            "Updated Office Name",
            "Updated Description",
            OfficeCategory.PLO
        );

        expect(updatedOffice.name).toBe("Updated Office Name");
        expect(updatedOffice.description).toBe("Updated Description");
        
        // Reset
        await officeRepo.updateOffice(
            office.id,
            "Public Lighting Office",
            "Technical office responsible for public lighting systems",
            OfficeCategory.PLO
        );
    });

    it("should delete a custom office", async () => {
        const customOffice = await officeRepo.createOffice(
            "Deletable Office",
            "To be deleted",
            OfficeCategory.WO
        );

        await officeRepo.deleteOffice(customOffice.id);

        const deletedOffice = await officeRepo.getOfficeById(customOffice.id);
        expect(deletedOffice).toBeNull();
    });

    it("should not update a non-existent office", async () => {
        await expect(
            officeRepo.updateOffice(
                99999,
                "Updated Office Name",
                "Updated Description",
                OfficeCategory.WSO
            )
        ).rejects.toThrow(AppError);
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