import { CitizenDAO } from "@dao/citizenDAO";
import { CitizenRepository } from "@repositories/citizenRepository";
import { initializeTestDataSource, closeTestDataSource, TestDataSource } from "../../setup/test-datasource";
import { beforeAllE2e, DEFAULT_CITIZENS } from "../../e2e/lifecycle";
import bcrypt from "bcrypt";

let citizenRepo: CitizenRepository;

beforeAll(async () => {
    await initializeTestDataSource();
    await beforeAllE2e(); // Initialize default entities
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

describe("CitizenRepository - test suite", () => {
    it("should create a new citizen", async () => {
        const newCitizen = {
            email: "barack.obama@example.com",
            username: "barackobama",
            name: "Barack",
            surname: "Obama",
            password: "securepassword",
            receive_emails: false,
            profilePicture: "",
            telegram_username: "",
        };

        await citizenRepo.createCitizen(
            newCitizen.email,
            newCitizen.username,
            newCitizen.name,
            newCitizen.surname,
            newCitizen.password,
            newCitizen.receive_emails,
            newCitizen.profilePicture,
            newCitizen.telegram_username,
        );
        
        const savedInDB = await TestDataSource
            .getRepository(CitizenDAO)
            .findOneBy({ username: newCitizen.username });
        expect(savedInDB).toBeDefined();
        expect(savedInDB?.username).toBe(newCitizen.username);
        expect(savedInDB?.email).toBeNull(); // Email is null until verified
        expect(savedInDB?.name).toBe(newCitizen.name);
        expect(savedInDB?.surname).toBe(newCitizen.surname);
    });

    it("should get all citizens (including defaults)", async () => {
        const newCitizen = {
            email: "donald.trump@example.com",
            username: "donaldtrump",
            name: "Donald",
            surname: "Trump",
            password: "verybigpassword",
            receive_emails: true,
            profilePicture: "",
            telegram_username: "",
        };

        await citizenRepo.createCitizen(
            newCitizen.email,
            newCitizen.username,
            newCitizen.name,
            newCitizen.surname,
            newCitizen.password,
            newCitizen.receive_emails,
            newCitizen.profilePicture,
            newCitizen.telegram_username,
        );
        
        const citizens = await citizenRepo.getAllCitizens();
        expect(citizens.length).toBeGreaterThanOrEqual(4); // 3 default + 1 new
        
        // Check that default citizens are present
        const usernames = citizens.map(c => c.username);
        expect(usernames).toContain(DEFAULT_CITIZENS.citizen1.username);
        expect(usernames).toContain(DEFAULT_CITIZENS.citizen2.username);
        expect(usernames).toContain(DEFAULT_CITIZENS.citizen3.username);
        expect(usernames).toContain(newCitizen.username);
    });

    it("should get default citizen by email", async () => {
        const citizen = await citizenRepo.getCitizenByEmail(DEFAULT_CITIZENS.citizen1.email);
        expect(citizen).toBeDefined();
        expect(citizen?.username).toBe(DEFAULT_CITIZENS.citizen1.username);
        expect(citizen?.email).toBe(DEFAULT_CITIZENS.citizen1.email);
    });

    it("should get default citizen by username", async () => {
        const citizen = await citizenRepo.getCitizenByUsername(DEFAULT_CITIZENS.citizen2.username);
        expect(citizen).toBeDefined();
        expect(citizen?.username).toBe(DEFAULT_CITIZENS.citizen2.username);
        expect(citizen?.email).toBe(DEFAULT_CITIZENS.citizen2.email);
    });

    it("should get default citizen by id", async () => {
        const allCitizens = await TestDataSource.getRepository(CitizenDAO).find();
        const defaultCitizen = allCitizens.find(c => c.username === DEFAULT_CITIZENS.citizen3.username);
        
        const citizen = await citizenRepo.getCitizenById(defaultCitizen!.id);
        expect(citizen).toBeDefined();
        expect(citizen?.username).toBe(DEFAULT_CITIZENS.citizen3.username);
    });

    it("should update default citizen", async () => {
        const updatedCitizen = await citizenRepo.updateCitizen(
            DEFAULT_CITIZENS.citizen1.username,
            { telegram_username: "@updated_telegram" }
        );
        
        expect(updatedCitizen.telegram_username).toBe("@updated_telegram");
        
        // Reset for other tests
        await citizenRepo.updateCitizen(
            DEFAULT_CITIZENS.citizen1.username,
            { telegram_username: "" }
        );
    });

    it("should return null for non-existent citizen by email", async () => {
        const citizen = await citizenRepo.getCitizenByEmail("nonexistent@example.com");
        expect(citizen).toBeNull();
    });

    it("should return null for non-existent citizen by username", async () => {
        const citizen = await citizenRepo.getCitizenByUsername("nonexistentuser");
        expect(citizen).toBeNull();
    });

    it("should return null for non-existent citizen by id", async () => {
        const citizen = await citizenRepo.getCitizenById(99999);
        expect(citizen).toBeNull();
    });

    it("should throw error when creating citizen with duplicate email", async () => {
        await expect(citizenRepo.createCitizen(
            DEFAULT_CITIZENS.citizen1.email, 
            "newusername",
            "New",
            "User",
            "password123",
            false,
            "",
            ""
        )).rejects.toThrow();
    });

    it("should throw error when creating citizen with duplicate username", async () => {
        await expect(citizenRepo.createCitizen(
            "newemail@example.com",
            DEFAULT_CITIZENS.citizen1.username,
            "New",
            "User",
            "password123",
            false,
            "",
            ""
        )).rejects.toThrow();
    });
});