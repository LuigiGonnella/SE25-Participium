import { CitizenDAO } from "@dao/citizenDAO";
import { CitizenRepository } from "@repositories/citizenRepository";
import { initializeTestDataSource, closeTestDataSource, TestDataSource } from "../../setup/test-datasource";
import { getAllCitizens, getCitizenByEmail, getCitizenById, getCitizenByUsername, updateCitizenProfile } from "@controllers/citizenController";
import { beforeAllE2e, DEFAULT_CITIZENS, TestDataManager } from "../../e2e/lifecycle";

let citizenRepo: CitizenRepository;

beforeAll(async () => {
    await initializeTestDataSource();
    await beforeAllE2e();
    citizenRepo = new CitizenRepository();
});

afterAll(async () => {
    await closeTestDataSource();
});

beforeEach(async () => {
    // Clear only non-default citizens
    const allCitizens = await TestDataSource.getRepository(CitizenDAO).find();
    const defaultUsernames = Object.values(DEFAULT_CITIZENS).map(c => c.username);
    const toDelete = allCitizens.filter(c => !defaultUsernames.includes(c.username));
    await TestDataSource.getRepository(CitizenDAO).remove(toDelete);
});

describe("CitizenController - test suite", () => {
    it("tests getAllCitizen with defaults", async () => {
        const citizens = await getAllCitizens();
        expect(citizens.length).toBeGreaterThanOrEqual(3);
        
        const usernames = citizens.map(c => c.username);
        expect(usernames).toContain(DEFAULT_CITIZENS.citizen1.username);
        expect(usernames).toContain(DEFAULT_CITIZENS.citizen2.username);
        expect(usernames).toContain(DEFAULT_CITIZENS.citizen3.username);
    });

    it("tests getCitizenByEmail with default citizen", async () => {
        const citizen = await getCitizenByEmail(DEFAULT_CITIZENS.citizen1.email);
        expect(citizen).toBeDefined();
        expect(citizen?.username).toBe(DEFAULT_CITIZENS.citizen1.username);
        expect(citizen?.email).toBe(DEFAULT_CITIZENS.citizen1.email);
        expect(citizen).not.toHaveProperty('password');
        expect(citizen).not.toHaveProperty('id');
    });

    it("tests getCitizenByUsername with default citizen", async () => {
        const citizen = await getCitizenByUsername(DEFAULT_CITIZENS.citizen2.username);
        expect(citizen).toBeDefined();
        expect(citizen?.username).toBe(DEFAULT_CITIZENS.citizen2.username);
        expect(citizen?.email).toBe(DEFAULT_CITIZENS.citizen2.email);
    });

    it("tests getCitizenById with default citizen", async () => {
        const citizenDAO = await TestDataManager.getCitizen('citizen3');
        const citizen = await getCitizenById(citizenDAO.id);
        expect(citizen).toBeDefined();
        expect(citizen?.username).toBe(DEFAULT_CITIZENS.citizen3.username);
    });

    it("tests updateCitizenProfile with default citizen", async () => {
        await updateCitizenProfile(DEFAULT_CITIZENS.citizen1.username, {
            telegram_username: "new_telegram",
            receive_emails: true
        });
        
        const updatedCitizen = await getCitizenByUsername(DEFAULT_CITIZENS.citizen1.username);
        expect(updatedCitizen?.telegram_username).toBe("new_telegram");
        expect(updatedCitizen?.receive_emails).toBe(true);
        
        // Reset
        await updateCitizenProfile(DEFAULT_CITIZENS.citizen1.username, {
            telegram_username: "",
            receive_emails: false
        });
    });

    it("tests getCitizenByEmail returns null for non-existent", async () => {
        const citizen = await getCitizenByEmail("nonexistent@example.com");
        expect(citizen).toBeNull();
    });

    it("tests getCitizenByUsername returns null for non-existent", async () => {
        const citizen = await getCitizenByUsername("nonexistentuser");
        expect(citizen).toBeNull();
    });

    it("tests getCitizenById returns null for non-existent", async () => {
        const citizen = await getCitizenById(99999);
        expect(citizen).toBeNull();
    });
});