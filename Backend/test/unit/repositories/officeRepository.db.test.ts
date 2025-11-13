import { OfficeDAO, OfficeCategory } from "@dao/officeDAO";
import { OfficeRepository } from "@repositories/officeRepository";
import { initializeTestDataSource, closeTestDataSource, TestDataSource } from "../../setup/test-datasource";
import AppError from "@models/errors/AppError";
import { StaffDAO, StaffRole } from "@models/dao/staffDAO";
import { ConflictError } from "@models/errors/ConflictError";

let officeRepo: OfficeRepository;

const office1 = {
    name: "Municipal Organization Office",
    description: "Handles municipal organization",
    category: OfficeCategory.MOO,
};

const office2 = {
    name: "Water Supply Office",
    description: "Handles water supply",
    category: OfficeCategory.WSO,
};

const staff1 = {
    username: "peppevessicchio",
    name: "Peppe",
    surname: "Vessicchio",
    password: "rip_maestro2025",
    role: StaffRole.TOSM,
};

beforeAll(async () => {
  await initializeTestDataSource();
  officeRepo = new OfficeRepository();
});

afterAll(async () => {
  await closeTestDataSource();
});

beforeEach(async () => {
    await TestDataSource.getRepository(OfficeDAO).clear();
    await TestDataSource.getRepository(StaffDAO).clear();
});

describe("OfficeRepository - test suite", () => {
    it("should create a new office", async () => {
        const newOffice = await officeRepo.createOffice(
            office1.name,
            office1.description,
            office1.category
        );
        expect(newOffice).toBeDefined();
        expect(newOffice.name).toBe(office1.name);
        expect(newOffice.description).toBe(office1.description);
        expect(newOffice.category).toBe(office1.category);
    });

    it("should get all offices", async () => {
        await officeRepo.createOffice(
            office1.name,
            office1.description,
            office1.category
        );
        await officeRepo.createOffice(
            office2.name,
            office2.description,
            office2.category
        );

        const offices = await officeRepo.getAllOffices();
        expect(offices).toHaveLength(2);
        expect(offices).toEqual(
            expect.arrayContaining([
                expect.objectContaining(office1),
                expect.objectContaining(office2),
            ])
        );
    });

    it("should get an office by id", async () => {
        await officeRepo.createOffice(
            office1.name,
            office1.description,
            office1.category
        );
        const savedInDB = await TestDataSource
                                .getRepository(OfficeDAO)
                                .findOneBy({category: office1.category });

        expect(savedInDB).toBeDefined();
        expect(savedInDB?.name).toBe(office1.name);
        expect(savedInDB?.description).toBe(office1.description);
        expect(savedInDB?.category).toBe(office1.category);
    });

    it("should get an office by name", async () => {
        await officeRepo.createOffice(
            office1.name,
            office1.description,
            office1.category
        );
        const office = await officeRepo.getOfficeByName(office1.name);
        expect(office).toBeDefined();
        expect(office?.name).toBe(office1.name);
        expect(office?.description).toBe(office1.description);
        expect(office?.category).toBe(office1.category);
    });

    it("should get an office by category", async () => {
        await officeRepo.createOffice(
            office1.name,
            office1.description,
            office1.category
        );
        const office = await officeRepo.getOfficeByCategory(office1.category);
        expect(office).toBeDefined();
        expect(office?.name).toBe(office1.name);
        expect(office?.description).toBe(office1.description);
        expect(office?.category).toBe(office1.category);

    });

    it("should update an existing office", async () => {
        const office = await officeRepo.createOffice(
            office1.name,
            office1.description,
            office1.category
        );

        const office_id = officeRepo.getOfficeByName(office1.name);

        const updatedOffice = await officeRepo.updateOffice(
            (await office_id)!.id,
            "Updated Office Name",
            "Updated Description",
            OfficeCategory.WSO
        );

    });

    it("should delete an existing office", async () => {
        const office = await officeRepo.createOffice(
            office1.name,
            office1.description,
            office1.category
        );

        const office_id = officeRepo.getOfficeByName(office1.name);

        await officeRepo.deleteOffice((await office_id)!.id);

        const deletedOffice = await officeRepo.getOfficeById((await office_id)!.id);
        expect(deletedOffice).toBeNull();
    });

    it("should create default offices if not exists", async () => {
        await officeRepo.createDefaultOfficesIfNotExist();

        const offices = await officeRepo.getAllOffices();

        expect(offices).toHaveLength(9);
        expect(offices).toEqual(expect.arrayContaining([
        expect.objectContaining({ category: OfficeCategory.MOO }),
        expect.objectContaining({ category: OfficeCategory.WSO }),
        expect.objectContaining({ category: OfficeCategory.ABO }),
        expect.objectContaining({ category: OfficeCategory.SSO }),
        expect.objectContaining({ category: OfficeCategory.PLO }),
        expect.objectContaining({ category: OfficeCategory.WO }),
        expect.objectContaining({ category: OfficeCategory.RSTLO }),
        expect.objectContaining({ category: OfficeCategory.RUFO }),
        expect.objectContaining({ category: OfficeCategory.PGAPO }),
        ]));
    });

    it("should not update a non-existent office", async () => {
        await expect(
            officeRepo.updateOffice(
                666,
                "Updated Office Name",
                "Updated Description",
                OfficeCategory.WSO
            )
        ).rejects.toThrow(AppError);
    });

    it("should not update an office with an existing name", async () => {
        await officeRepo.createOffice(
            office1.name,
            office1.description,
            office1.category
        );
        await officeRepo.createOffice(
            office2.name,
            office2.description,
            office2.category
        );

        await expect(
            officeRepo.updateOffice(
                (await officeRepo.getOfficeByName(office1.name))!.id,
                office2.name,
                "Updated Description",
                OfficeCategory.WSO
            )
        ).rejects.toThrow(ConflictError);
    });

    it("should not update an office with an existing name", async () => {
        await officeRepo.createOffice(
            office1.name,
            office1.description,
            office1.category
        );
        await officeRepo.createOffice(
            office2.name,
            office2.description,
            office2.category
        );

        await expect(
            officeRepo.updateOffice(
                (await officeRepo.getOfficeByName(office1.name))!.id,
                office1.name,
                "Updated Description",
                OfficeCategory.WSO
            )
        ).rejects.toThrow(ConflictError);
    });

    it("should not delete a non-existent office", async () => {
        await expect(
            officeRepo.deleteOffice(666)
        ).rejects.toThrow(AppError);
    });

    it("should not delete an office with active staff", async () => {
        const office = await officeRepo.createOffice(
            office1.name,
            office1.description,
            office1.category
        );

        const staffRepo = TestDataSource.getRepository(StaffDAO);
        const staffMember = staffRepo.create({
            username: staff1.username,
            name: staff1.name,
            surname: staff1.surname,
            password: staff1.password,
            role: staff1.role,
            office: office
        });
        await staffRepo.save(staffMember);

        await expect(
            officeRepo.deleteOffice(office.id)
        ).rejects.toThrow(AppError);
    });


});