import { TestDataSource } from "../setup/test-datasource";
import { CitizenDAO } from "@dao/citizenDAO";
import { StaffDAO, StaffRole } from "@dao/staffDAO";
import { ReportDAO } from "@dao/reportDAO";
import { NotificationDAO } from "@dao/notificationDAO";
import { CitizenRepository } from "@repositories/citizenRepository";
import { AppDataSource } from "@database";
import { StaffRepository } from "@repositories/staffRepository";
import { OfficeRepository } from "@repositories/officeRepository";
import { OfficeCategory, OfficeDAO } from "@dao/officeDAO";

/**
 * Default entities available in tests after initialization
 * These are created automatically by the repositories
 */
export const DEFAULT_STAFF = {
    admin: {
        username: "admin",
        password: "admin123",
        role: StaffRole.ADMIN,
    },
    mpro: {
        username: "mpro",
        password: "mpro123",
        role: StaffRole.MPRO,
    },
    // TOSM staff members (one per category)
    tosm_WSO: { username: "tosm_WSO", password: "tosm123", role: StaffRole.TOSM },
    tosm_ABO: { username: "tosm_ABO", password: "tosm123", role: StaffRole.TOSM },
    tosm_SSO: { username: "tosm_SSO", password: "tosm123", role: StaffRole.TOSM },
    tosm_PLO: { username: "tosm_PLO", password: "tosm123", role: StaffRole.TOSM },
    tosm_WO: { username: "tosm_WO", password: "tosm123", role: StaffRole.TOSM },
    tosm_RSTLO: { username: "tosm_RSTLO", password: "tosm123", role: StaffRole.TOSM },
    tosm_RUFO: { username: "tosm_RUFO", password: "tosm123", role: StaffRole.TOSM },
    tosm_PGAPO: { username: "tosm_PGAPO", password: "tosm123", role: StaffRole.TOSM },
    // EM staff members (one per category)
    em_WSO: { username: "em_WSO", password: "em123", role: StaffRole.EM },
    em_ABO: { username: "em_ABO", password: "em123", role: StaffRole.EM },
    em_SSO: { username: "em_SSO", password: "em123", role: StaffRole.EM },
    em_PLO: { username: "em_PLO", password: "em123", role: StaffRole.EM },
    em_WO: { username: "em_WO", password: "em123", role: StaffRole.EM },
    em_RSTLO: { username: "em_RSTLO", password: "em123", role: StaffRole.EM },
    em_RUFO: { username: "em_RUFO", password: "em123", role: StaffRole.EM },
    em_PGAPO: { username: "em_PGAPO", password: "em123", role: StaffRole.EM },
};

export const DEFAULT_CITIZENS = {
    citizen1: {
        username: "cit_1",
        email: "example1@example.com",
        password: "cit123",
        name: "Default1",
        surname: "Citizen",
    },
    citizen2: {
        username: "cit_2",
        email: "example2@example.com",
        password: "cit123",
        name: "Default2",
        surname: "Citizen",
    },
    citizen3: {
        username: "cit_3",
        email: "example3@example.com",
        password: "cit123",
        name: "Default3",
        surname: "Citizen",
    },
};

/**
 * Helper class to manage E2E test data and provide easy access to default entities
 */
export class TestDataManager {
    private static citizenRepo: CitizenRepository;
    private static staffRepo: StaffRepository;
    private static officeRepo: OfficeRepository;

    static async initialize() {
        this.citizenRepo = new CitizenRepository();
        this.staffRepo = new StaffRepository();
        this.officeRepo = new OfficeRepository();

        // Create default entities if they don't exist
        await this.officeRepo.createDefaultOfficesIfNotExist();
        await this.staffRepo.createDefaultStaffMembersIfNotExists();
        await this.citizenRepo.createDefaultCitizensIfNotExist(3);
    }

    /**
     * Get a default citizen DAO by key
     */
    static async getCitizen(key: keyof typeof DEFAULT_CITIZENS): Promise<CitizenDAO> {
        const citizen = DEFAULT_CITIZENS[key];
        const dao = await TestDataSource.getRepository(CitizenDAO).findOne({
            where: { username: citizen.username }
        });
        if (!dao) {
            throw new Error(`Default citizen ${citizen.username} not found in database`);
        }
        return dao;
    }

    /**
     * Get a default staff DAO by key
     */
    static async getStaff(key: keyof typeof DEFAULT_STAFF): Promise<StaffDAO> {
        const staff = DEFAULT_STAFF[key];
        const dao = await TestDataSource.getRepository(StaffDAO).findOne({
            where: { username: staff.username },
            relations: ['offices']
        });
        if (!dao) {
            throw new Error(`Default staff ${staff.username} not found in database`);
        }
        return dao;
    }

    /**
     * Get an office by category
     */
    static async getOffice(category: OfficeCategory, isExternal: boolean = false): Promise<OfficeDAO> {
        const office = await TestDataSource.getRepository(OfficeDAO).findOne({
            where: { category, isExternal }
        });
        if (!office) {
            throw new Error(`Office with category ${category} (external: ${isExternal}) not found`);
        }
        return office;
    }

    /**
     * Get all offices
     */
    static async getAllOffices(): Promise<OfficeDAO[]> {
        return await TestDataSource.getRepository(OfficeDAO).find();
    }

    /**
     * Clear all test data (reports, notifications, but keep default entities)
     */
    static async clearTestData(): Promise<void> {
        await TestDataSource.getRepository(NotificationDAO).clear();
        await TestDataSource.getRepository(ReportDAO).clear();
    }

    /**
     * Clear everything including default entities (use with caution)
     */
    static async clearAllData(): Promise<void> {
        await TestDataSource.getRepository(NotificationDAO).clear();
        await TestDataSource.getRepository(ReportDAO).clear();
        await TestDataSource.getRepository(CitizenDAO).clear();
        await TestDataSource.getRepository(StaffDAO).clear();
        await TestDataSource.getRepository(OfficeDAO).clear();
    }
}

/**
 * Initialize test database and seed with default data
 * This should be called once in beforeAll
 */
export async function beforeAllE2e(): Promise<void> {
    // Initialize TestDataSource if not already initialized
    if (!TestDataSource.isInitialized) {
        await TestDataSource.initialize();
        // Make AppDataSource point to TestDataSource for the tests
        Object.assign(AppDataSource, TestDataSource);
    }

    // Initialize default entities
    await TestDataManager.initialize();
}

/**
 * Clean up test database
 * This should be called once in afterAll
 */
export async function afterAllE2e(): Promise<void> {
    if (TestDataSource.isInitialized) {
        await TestDataManager.clearAllData();
        await TestDataSource.destroy();
    }
}

/**
 * Clear transient test data between tests (reports, notifications)
 * Keep default entities (staff, citizens, offices)
 * This should be called in beforeEach
 */
export async function beforeEachE2e(): Promise<void> {
    await TestDataManager.clearTestData();
}