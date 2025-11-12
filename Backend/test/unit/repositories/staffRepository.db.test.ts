import { StaffDAO, StaffRole } from "@dao/staffDAO";
import { OfficeDAO, OfficeCategory } from "@dao/officeDAO";
import { StaffRepository } from "@repositories/staffRepository";
import { initializeTestDataSource, closeTestDataSource, TestDataSource } from "../../setup/test-datasource";
import bcrypt from "bcrypt";

let staffRepo: StaffRepository;

const office1 = {
    name: "Municipal Public Relations Office",
    description: "Handles public relations",
    category: OfficeCategory.MOO,
};

const office2 = {
    name: "Water Supply Office",
    description: "Handles water supply",
    category: OfficeCategory.WSO,
};

const staff1 = {
    username: "johndoe",
    name: "John",
    surname: "Doe",
    password: "password123",
    role: StaffRole.MPRO,
};

const staff2 = {
    username: "janedoe",
    name: "Jane",
    surname: "Doe",
    password: "securepass456",
    role: StaffRole.TOSM,
};

beforeAll(async () => {
  await initializeTestDataSource();
  staffRepo = new StaffRepository();
});

afterAll(async () => {
  await closeTestDataSource();
});

beforeEach(async () => {
    await TestDataSource.getRepository(StaffDAO).clear();
    await TestDataSource.getRepository(OfficeDAO).clear();
});

describe("StaffRepository - test suite", () => {
    it("should create a new staff with office", async () => {
        const office = await TestDataSource
            .getRepository(OfficeDAO)
            .save(office1);
        
        const createdStaff = await staffRepo.createStaff(
            staff1.username,
            staff1.name,
            staff1.surname,
            staff1.password,
            staff1.role,
            office.name
        );
        const savedInDB = await TestDataSource
            .getRepository(StaffDAO)
            .findOne({ where: { username: staff1.username }, relations: ["office"] });
        
        expect(savedInDB).toBeDefined();
        expect(savedInDB?.username).toBe(staff1.username);
        expect(savedInDB?.office).toBeDefined();
        expect(savedInDB?.office.id).toBe(office.id);
        expect(savedInDB?.office.name).toBe(office1.name);
    });

    it("should get all staffs", async () => {
        const office1Saved = await TestDataSource
            .getRepository(OfficeDAO)
            .save(office1);
        const office2Saved = await TestDataSource
            .getRepository(OfficeDAO)
            .save(office2);
        
        await staffRepo.createStaff(
            staff1.username,
            staff1.name,
            staff1.surname,
            staff1.password,
            staff1.role,
            office1Saved.name
        );
        await staffRepo.createStaff(
            staff2.username,
            staff2.name,
            staff2.surname,
            staff2.password,
            staff2.role,
            office2Saved.name
        );
        
        const staffs = await staffRepo.getAllStaffs();
        expect(staffs).toHaveLength(2);
        expect(staffs).toEqual(
            expect.arrayContaining([
                expect.objectContaining({
                    username: staff1.username,
                    name: staff1.name,
                    surname: staff1.surname,
                }),
                expect.objectContaining({
                    username: staff2.username,
                    name: staff2.name,
                    surname: staff2.surname,
                }),
            ])
        );
    });

    it("should get staff by username", async () => {
        const office = await TestDataSource
            .getRepository(OfficeDAO)
            .save(office1);
        
        await staffRepo.createStaff(
            staff1.username,
            staff1.name,
            staff1.surname,
            staff1.password,
            staff1.role,
            office.name
        );
        
        const staff = await staffRepo.getStaffByUsername(staff1.username);
        expect(staff).toBeDefined();
        expect(staff?.username).toBe(staff1.username);
        expect(staff?.name).toBe(staff1.name);
        expect(staff?.surname).toBe(staff1.surname);
        expect(staff?.role).toBe(staff1.role);
    });

    it("should get staff by ID", async () => {
        const office = await TestDataSource
            .getRepository(OfficeDAO)
            .save(office1);
        
        await staffRepo.createStaff(
            staff1.username,
            staff1.name,
            staff1.surname,
            staff1.password,
            staff1.role,
            office.name
        );
        const savedInDB = await TestDataSource
            .getRepository(StaffDAO)
            .findOneBy({ username: staff1.username });
        
        const staff = await staffRepo.getStaffById(savedInDB!.id);
        expect(staff).toBeDefined();
        expect(staff?.username).toBe(staff1.username);
        expect(staff?.name).toBe(staff1.name);
        expect(staff?.surname).toBe(staff1.surname);
        expect(staff?.role).toBe(staff1.role);
    });

    it("should create default admin if not exists", async () => {
        await staffRepo.createDefaultAdminIfNotExists();
        
        const admin = await TestDataSource
            .getRepository(StaffDAO)
            .findOneBy({ username: "admin" });
        
        expect(admin).toBeDefined();
        expect(admin?.username).toBe("admin");
        expect(admin?.name).toBe("Default");
        expect(admin?.surname).toBe("Admin");
        expect(admin?.role).toBe(StaffRole.ADMIN);
        expect(bcrypt.compareSync("admin123", admin!.password)).toBe(true);
    });

    it("should not create duplicate admin", async () => {
        await staffRepo.createDefaultAdminIfNotExists();
        await staffRepo.createDefaultAdminIfNotExists();
        
        const admins = await TestDataSource
            .getRepository(StaffDAO)
            .find({ where: { username: "admin" } });
        
        expect(admins).toHaveLength(1);
    });

    it("should throw error when creating staff with missing required fields", async () => {
        await expect(
            staffRepo.createStaff("", staff1.name, staff1.surname, staff1.password, staff1.role)
        ).rejects.toThrow("Invalid input data: username, name, surname, and password are required");
    });

    it("should throw conflict error when creating staff with duplicate username", async () => {
        const office = await TestDataSource
            .getRepository(OfficeDAO)
            .save(office1);
        
        await staffRepo.createStaff(
            staff1.username,
            staff1.name,
            staff1.surname,
            staff1.password,
            staff1.role,
            office.name
        );
        
        await expect(
            staffRepo.createStaff(
                staff1.username,
                "Different",
                "Name",
                "differentpass",
                StaffRole.ADMIN,
                office.name
            )
        ).rejects.toThrow(`Staff already exists with username ${staff1.username}`);
    });

    it("should throw error when creating staff with non-existent office", async () => {
        await expect(
            staffRepo.createStaff(
                staff1.username,
                staff1.name,
                staff1.surname,
                staff1.password,
                staff1.role,
                "NonExistentOffice"
            )
        ).rejects.toThrow("Office with name NonExistentOffice not found");
    });
});
