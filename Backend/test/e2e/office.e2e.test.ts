import { OfficeDAO, OfficeCategory } from "@dao/officeDAO";
import { StaffDAO, StaffRole } from "@models/dao/staffDAO";
import { OfficeRepository } from "@repositories/officeRepository";
import { initializeTestDataSource, closeTestDataSource, TestDataSource } from "../setup/test-datasource";

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

