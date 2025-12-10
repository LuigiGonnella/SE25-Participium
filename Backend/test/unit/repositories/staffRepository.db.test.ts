import { StaffDAO, StaffRole } from "@dao/staffDAO";
import { OfficeDAO, OfficeCategory } from "@dao/officeDAO";
import { StaffRepository } from "@repositories/staffRepository";
import { OfficeRepository } from "@repositories/officeRepository";
import { initializeTestDataSource, closeTestDataSource, TestDataSource } from "../../setup/test-datasource";
import { beforeAllE2e, DEFAULT_STAFF, TestDataManager } from "../../e2e/lifecycle";

let staffRepo: StaffRepository;
let officeRepo: OfficeRepository;

beforeAll(async () => {
    await initializeTestDataSource();
    await beforeAllE2e(); // Initialize default entities
    staffRepo = new StaffRepository();
    officeRepo = new OfficeRepository();
});

afterAll(async () => {
    await closeTestDataSource();
});

beforeEach(async () => {
    // Clear only non-default staff
    const allStaff = await TestDataSource.getRepository(StaffDAO).find();
    const defaultUsernames = Object.values(DEFAULT_STAFF).map(s => s.username);
    const toDelete = allStaff.filter(s => !defaultUsernames.includes(s.username));
    await TestDataSource.getRepository(StaffDAO).remove(toDelete);
});

describe("StaffRepository - test suite", () => {
    it("should get default admin staff", async () => {
        const admin = await staffRepo.getStaffByUsername(DEFAULT_STAFF.admin.username);
        expect(admin).toBeDefined();
        expect(admin?.username).toBe(DEFAULT_STAFF.admin.username);
        expect(admin?.role).toBe(StaffRole.ADMIN);
    });

    it("should get default MPRO staff", async () => {
        const mpro = await staffRepo.getStaffByUsername(DEFAULT_STAFF.mpro.username);
        expect(mpro).toBeDefined();
        expect(mpro?.username).toBe(DEFAULT_STAFF.mpro.username);
        expect(mpro?.role).toBe(StaffRole.MPRO);
    });

    it("should get default TOSM staff for RSTLO", async () => {
        const tosm = await staffRepo.getStaffByUsername(DEFAULT_STAFF.tosm_RSTLO.username);
        expect(tosm).toBeDefined();
        expect(tosm?.username).toBe(DEFAULT_STAFF.tosm_RSTLO.username);
        expect(tosm?.role).toBe(StaffRole.TOSM);
    });

    it("should get default EM staff for WSO", async () => {
        const em = await staffRepo.getStaffByUsername(DEFAULT_STAFF.em_WSO.username);
        expect(em).toBeDefined();
        expect(em?.username).toBe(DEFAULT_STAFF.em_WSO.username);
        expect(em?.role).toBe(StaffRole.EM);
    });

    it("should create a new staff with office", async () => {
        const office = await TestDataManager.getOffice(OfficeCategory.PLO);
        
        const createdStaff = await staffRepo.createStaff(
            "newstaff",
            "New",
            "Staff",
            "password123",
            StaffRole.TOSM,
            [office.name]
        );
        
        const savedInDB = await TestDataSource
            .getRepository(StaffDAO)
            .findOne({ where: { username: "newstaff" }, relations: ["offices"] });
        
        expect(savedInDB).toBeDefined();
        expect(savedInDB?.username).toBe("newstaff");
        expect(savedInDB?.offices).toBeDefined();
        expect(savedInDB?.offices[0].category).toBe(OfficeCategory.PLO);
    });

    it("should get all staffs (including defaults)", async () => {
        const staffs = await staffRepo.getAllStaffs();
        expect(staffs.length).toBeGreaterThanOrEqual(18); // 1 admin + 1 mpro + 8 tosm + 8 em
        
        // Check that defaults are present
        const usernames = staffs.map(s => s.username);
        expect(usernames).toContain(DEFAULT_STAFF.admin.username);
        expect(usernames).toContain(DEFAULT_STAFF.mpro.username);
        expect(usernames).toContain(DEFAULT_STAFF.tosm_RSTLO.username);
    });

    /*it("should get all staffs by role TOSM", async () => {
        const tosms = await staffRepo.getAllStaffsByRole(StaffRole.TOSM);
        expect(tosms.length).toBeGreaterThanOrEqual(8); // 8 default TOSM
        expect(tosms.every(s => s.role === StaffRole.TOSM)).toBe(true);
    });

    it("should get all staffs by role EM", async () => {
        const ems = await staffRepo.getAllStaffsByRole(StaffRole.EM);
        expect(ems.length).toBeGreaterThanOrEqual(8); // 8 default EM
        expect(ems.every(s => s.role === StaffRole.EM)).toBe(true);
    }); 

    it("should update default staff", async () => {
        const updatedStaff = await staffRepo.updateStaff(
            DEFAULT_STAFF.tosm_PLO.username,
            { name: "Updated" }
        );
        
        expect(updatedStaff.name).toBe("Updated");
        
        // Reset for other tests
        await staffRepo.updateStaff(
            DEFAULT_STAFF.tosm_PLO.username,
            { name: "Default" }
        );
    }); */

    it("should return null for non-existent staff", async () => {
        const staff = await staffRepo.getStaffByUsername("nonexistentstaff");
        expect(staff).toBeNull();
    });

    it("should throw error when creating staff with duplicate username", async () => {
        const office = await TestDataManager.getOffice(OfficeCategory.WSO);
        
        await expect(staffRepo.createStaff(
            DEFAULT_STAFF.admin.username, // Duplicate username
            "New",
            "Admin",
            "password123",
            StaffRole.ADMIN,
            [office.name]
        )).rejects.toThrow();
    });

    // ===== Multiple Offices =====

    describe("Multiple offices functionality", () => {
        it("should create staff with multiple offices", async () => {
            const office1 = await TestDataManager.getOffice(OfficeCategory.PLO);
            const office2 = await TestDataManager.getOffice(OfficeCategory.WO);
            
            const createdStaff = await staffRepo.createStaff(
                "multi_office_staff",
                "Multi",
                "Office",
                "password123",
                StaffRole.TOSM,
                [office1.name, office2.name]
            );
            
            const savedInDB = await TestDataSource
                .getRepository(StaffDAO)
                .findOne({ where: { username: "multi_office_staff" }, relations: ["offices"] });
            
            expect(savedInDB).toBeDefined();
            expect(savedInDB?.offices).toHaveLength(2);
            const categories = savedInDB?.offices.map(o => o.category);
            expect(categories).toContain(OfficeCategory.PLO);
            expect(categories).toContain(OfficeCategory.WO);
        });

        it("should update staff offices completely (replace all)", async () => {
            const office1 = await TestDataManager.getOffice(OfficeCategory.ABO);
            const office2 = await TestDataManager.getOffice(OfficeCategory.SSO);
            const office3 = await TestDataManager.getOffice(OfficeCategory.RSTLO);
            
            // Create staff with one office
            const staff = await staffRepo.createStaff(
                "staff_to_update",
                "Update",
                "Test",
                "password123",
                StaffRole.TOSM,
                [office1.name]
            );
            
            expect(staff.offices).toHaveLength(1);
            
            // Update to different offices
            const updated = await staffRepo.updateStaffOffices(
                "staff_to_update",
                [office2.name, office3.name]
            );
            
            expect(updated.offices).toHaveLength(2);
            const categories = updated.offices.map(o => o.category);
            expect(categories).toContain(OfficeCategory.SSO);
            expect(categories).toContain(OfficeCategory.RSTLO);
            expect(categories).not.toContain(OfficeCategory.ABO);
        });

        it("should add an office to staff", async () => {
            const office1 = await TestDataManager.getOffice(OfficeCategory.RUFO);
            const office2 = await TestDataManager.getOffice(OfficeCategory.PGAPO);
            
            // Create staff with one office
            const staff = await staffRepo.createStaff(
                "staff_add_office",
                "Add",
                "Office",
                "password123",
                StaffRole.TOSM,
                [office1.name]
            );
            
            expect(staff.offices).toHaveLength(1);
            
            // Add another office
            const updated = await staffRepo.addOfficeToStaff(
                "staff_add_office",
                office2.name
            );
            
            expect(updated.offices).toHaveLength(2);
            const categories = updated.offices.map(o => o.category);
            expect(categories).toContain(OfficeCategory.RUFO);
            expect(categories).toContain(OfficeCategory.PGAPO);
        });

        it("should remove an office from staff", async () => {
            const office1 = await TestDataManager.getOffice(OfficeCategory.PLO);
            const office2 = await TestDataManager.getOffice(OfficeCategory.WO);
            const office3 = await TestDataManager.getOffice(OfficeCategory.ABO);
            
            // Create staff with three offices
            const staff = await staffRepo.createStaff(
                "staff_remove_office",
                "Remove",
                "Office",
                "password123",
                StaffRole.TOSM,
                [office1.name, office2.name, office3.name]
            );
            
            expect(staff.offices).toHaveLength(3);
            
            // Remove one office
            const updated = await staffRepo.removeOfficeFromStaff(
                "staff_remove_office",
                office2.name
            );
            
            expect(updated.offices).toHaveLength(2);
            const categories = updated.offices.map(o => o.category);
            expect(categories).toContain(OfficeCategory.PLO);
            expect(categories).toContain(OfficeCategory.ABO);
            expect(categories).not.toContain(OfficeCategory.WO);
        });

        it("should throw error when adding office that staff already has", async () => {
            const office = await TestDataManager.getOffice(OfficeCategory.SSO);
            
            const staff = await staffRepo.createStaff(
                "staff_duplicate_office",
                "Duplicate",
                "Office",
                "password123",
                StaffRole.TOSM,
                [office.name]
            );
            
            await expect(
                staffRepo.addOfficeToStaff("staff_duplicate_office", office.name)
            ).rejects.toThrow("Staff already has office");
        });

        it("should throw error when updating to non-existent offices", async () => {
            const office = await TestDataManager.getOffice(OfficeCategory.RSTLO);
            
            await staffRepo.createStaff(
                "staff_invalid_update",
                "Invalid",
                "Update",
                "password123",
                StaffRole.TOSM,
                [office.name]
            );
            
            await expect(
                staffRepo.updateStaffOffices(
                    "staff_invalid_update",
                    ["NonExistentOffice1", "NonExistentOffice2"]
                )
            ).rejects.toThrow("Offices not found");
        });

        it("should throw error when adding non-existent office", async () => {
            const office = await TestDataManager.getOffice(OfficeCategory.RUFO);
            
            await staffRepo.createStaff(
                "staff_invalid_add",
                "Invalid",
                "Add",
                "password123",
                StaffRole.TOSM,
                [office.name]
            );
            
            await expect(
                staffRepo.addOfficeToStaff("staff_invalid_add", "NonExistentOffice")
            ).rejects.toThrow("Office not found");
        });

        it("should throw error when removing non-existent office", async () => {
            const office = await TestDataManager.getOffice(OfficeCategory.PGAPO);
            
            await staffRepo.createStaff(
                "staff_invalid_remove",
                "Invalid",
                "Remove",
                "password123",
                StaffRole.TOSM,
                [office.name]
            );
            
            await expect(
                staffRepo.removeOfficeFromStaff("staff_invalid_remove", "NonExistentOffice")
            ).rejects.toThrow("Office not found");
        });

        it("should throw error when updating offices for non-existent staff", async () => {
            const office = await TestDataManager.getOffice(OfficeCategory.WO);
            
            await expect(
                staffRepo.updateStaffOffices("nonexistent_user", [office.name])
            ).rejects.toThrow("Staff not found");
        });

        it("should throw error when adding office to non-existent staff", async () => {
            const office = await TestDataManager.getOffice(OfficeCategory.PLO);
            
            await expect(
                staffRepo.addOfficeToStaff("nonexistent_user", office.name)
            ).rejects.toThrow("Staff not found");
        });

        it("should throw error when removing office from non-existent staff", async () => {
            const office = await TestDataManager.getOffice(OfficeCategory.ABO);
            
            await expect(
                staffRepo.removeOfficeFromStaff("nonexistent_user", office.name)
            ).rejects.toThrow("Staff not found");
        });

        it("should create staff with single office using array", async () => {
            const office = await TestDataManager.getOffice(OfficeCategory.SSO);
            
            const createdStaff = await staffRepo.createStaff(
                "single_office_array",
                "Single",
                "Array",
                "password123",
                StaffRole.TOSM,
                [office.name]
            );
            
            expect(createdStaff.offices).toHaveLength(1);
            expect(createdStaff.offices[0].category).toBe(OfficeCategory.SSO);
        });

        it("should allow creating staff with empty offices array", async () => {
            const created = await staffRepo.createStaff(
                "no_offices",
                "No",
                "Offices",
                "password123",
                StaffRole.TOSM,
                []
            );

            expect(created).toBeDefined();
            expect(created.offices).toHaveLength(0);
        });

        it("should throw error when creating staff with some invalid office names", async () => {
            const office = await TestDataManager.getOffice(OfficeCategory.RSTLO);
            
            await expect(staffRepo.createStaff(
                "partial_invalid",
                "Partial",
                "Invalid",
                "password123",
                StaffRole.TOSM,
                [office.name, "NonExistentOffice"]
            )).rejects.toThrow("Offices not found");
        });

        it("should handle updating staff to have no common offices with previous assignment", async () => {
            const office1 = await TestDataManager.getOffice(OfficeCategory.PLO);
            const office2 = await TestDataManager.getOffice(OfficeCategory.WO);
            const office3 = await TestDataManager.getOffice(OfficeCategory.ABO);
            const office4 = await TestDataManager.getOffice(OfficeCategory.SSO);
            
            // Create with offices 1 and 2
            await staffRepo.createStaff(
                "complete_replace",
                "Complete",
                "Replace",
                "password123",
                StaffRole.TOSM,
                [office1.name, office2.name]
            );
            
            // Update to completely different offices 3 and 4
            const updated = await staffRepo.updateStaffOffices(
                "complete_replace",
                [office3.name, office4.name]
            );
            
            expect(updated.offices).toHaveLength(2);
            const categories = updated.offices.map(o => o.category);
            expect(categories).toContain(OfficeCategory.ABO);
            expect(categories).toContain(OfficeCategory.SSO);
            expect(categories).not.toContain(OfficeCategory.PLO);
            expect(categories).not.toContain(OfficeCategory.WO);
        });

        it("should throw error when updateStaffOffices receives non-array parameter", async () => {
            const office = await TestDataManager.getOffice(OfficeCategory.RUFO);
            
            await staffRepo.createStaff(
                "array_check",
                "Array",
                "Check",
                "password123",
                StaffRole.TOSM,
                [office.name]
            );
            
            await expect(
                staffRepo.updateStaffOffices("array_check", "NotAnArray" as any)
            ).rejects.toThrow("officeNames must be an array");
        });
    });
});