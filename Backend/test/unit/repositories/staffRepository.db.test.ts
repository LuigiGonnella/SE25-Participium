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
            office.name
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

    it("should get all staffs by role TOSM", async () => {
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
    });

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
            office.name
        )).rejects.toThrow();
    });
});