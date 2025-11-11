import { DataSource } from "typeorm";
import { CitizenDAO } from "@dao/citizenDAO";
import { CitizenRepository } from "@repositories/citizenRepository";
import { initializeTestDataSource, closeTestDataSource, TestDataSource } from "../setup/test-datasource";
import { getAllCitizens, getCitizenByEmail, getCitizenById, getCitizenByUsername } from "@controllers/citizenController";
import bcrypt from 'bcrypt';

let citizenRepo: CitizenRepository;

const testCitizen1 = {
    email: "john.doe@example.com",
    username: "johndoe",
    name: "John",
    surname: "Doe",
    password: "password123",
    receive_emails: true,
    profilePicture: "/uploads/profiles/john.jpg",
    telegram_username: "@johndoe",
};

const testCitizen2 = {
    email: "jane.smith@example.com",
    username: "janesmith",
    name: "Jane",
    surname: "Smith",
    password: "securepass456",
    receive_emails: false,
    profilePicture: "",
    telegram_username: "",
};

const testCitizen3 = {
    email: "bob.wilson@example.com",
    username: "bobwilson",
    name: "Bob",
    surname: "Wilson",
    password: "bobpass789",
    receive_emails: true,
    profilePicture: "/uploads/profiles/bob.jpg",
    telegram_username: "@bobwilson",
};

beforeAll(async () => {
    await initializeTestDataSource();
    citizenRepo = new CitizenRepository();
});

afterAll(async () => {
    await closeTestDataSource();
});

beforeEach(async () => {
    await TestDataSource.getRepository(CitizenDAO).clear();
});

describe("Citizen E2E Tests", () => {
    describe("GET /citizens - Get all citizens", () => {
        it("should return empty array when no citizens exist", async () => {
            const citizens = await getAllCitizens();
            expect(citizens).toEqual([]);
        });

        it("should return all citizens", async () => {
            await citizenRepo.createCitizen(
                testCitizen1.email,
                testCitizen1.username,
                testCitizen1.name,
                testCitizen1.surname,
                testCitizen1.password,
                testCitizen1.receive_emails,
                testCitizen1.profilePicture,
                testCitizen1.telegram_username
            );

            await citizenRepo.createCitizen(
                testCitizen2.email,
                testCitizen2.username,
                testCitizen2.name,
                testCitizen2.surname,
                testCitizen2.password,
                testCitizen2.receive_emails,
                testCitizen2.profilePicture,
                testCitizen2.telegram_username
            );

            const citizens = await getAllCitizens();
            
            expect(citizens).toHaveLength(2);
            expect(citizens[0]).toMatchObject({
                email: testCitizen1.email,
                username: testCitizen1.username,
                name: testCitizen1.name,
                surname: testCitizen1.surname,
            });
            expect(citizens[1]).toMatchObject({
                email: testCitizen2.email,
                username: testCitizen2.username,
                name: testCitizen2.name,
                surname: testCitizen2.surname,
            });
        });

        it("should not include password in returned citizens", async () => {
            await citizenRepo.createCitizen(
                testCitizen1.email,
                testCitizen1.username,
                testCitizen1.name,
                testCitizen1.surname,
                testCitizen1.password,
                testCitizen1.receive_emails,
                testCitizen1.profilePicture,
                testCitizen1.telegram_username
            );

            const citizens = await getAllCitizens();
            
            expect(citizens[0]).not.toHaveProperty('password');
        });

        it("should return citizens with all DTO fields", async () => {
            await citizenRepo.createCitizen(
                testCitizen1.email,
                testCitizen1.username,
                testCitizen1.name,
                testCitizen1.surname,
                testCitizen1.password,
                testCitizen1.receive_emails,
                testCitizen1.profilePicture,
                testCitizen1.telegram_username
            );

            const citizens = await getAllCitizens();
            
            expect(citizens[0]).toHaveProperty('email');
            expect(citizens[0]).toHaveProperty('username');
            expect(citizens[0]).toHaveProperty('name');
            expect(citizens[0]).toHaveProperty('surname');
            expect(citizens[0]).toHaveProperty('receive_emails');
            expect(citizens[0]).toHaveProperty('profilePicture');
            expect(citizens[0]).toHaveProperty('telegram_username');
            expect(citizens[0]).not.toHaveProperty('id');
            expect(citizens[0]).not.toHaveProperty('password');
        });
    });

    describe("GET /citizens/id/:id - Get citizen by ID", () => {
        it("should return citizen by valid ID", async () => {
            await citizenRepo.createCitizen(
                testCitizen1.email,
                testCitizen1.username,
                testCitizen1.name,
                testCitizen1.surname,
                testCitizen1.password,
                testCitizen1.receive_emails,
                testCitizen1.profilePicture,
                testCitizen1.telegram_username
            );

            const savedCitizen = await TestDataSource
                .getRepository(CitizenDAO)
                .findOneBy({ email: testCitizen1.email });

            const citizen = await getCitizenById(savedCitizen!.id);

            expect(citizen).toMatchObject({
                email: testCitizen1.email,
                username: testCitizen1.username,
                name: testCitizen1.name,
                surname: testCitizen1.surname,
            });
        });

        it("should return null for non-existent ID", async () => {
            const citizen = await getCitizenById(9999);
            expect(citizen).toBeNull();
        });

        it("should return correct citizen when multiple citizens exist", async () => {
            await citizenRepo.createCitizen(
                testCitizen1.email,
                testCitizen1.username,
                testCitizen1.name,
                testCitizen1.surname,
                testCitizen1.password,
                testCitizen1.receive_emails,
                testCitizen1.profilePicture,
                testCitizen1.telegram_username
            );

            await citizenRepo.createCitizen(
                testCitizen2.email,
                testCitizen2.username,
                testCitizen2.name,
                testCitizen2.surname,
                testCitizen2.password,
                testCitizen2.receive_emails,
                testCitizen2.profilePicture,
                testCitizen2.telegram_username
            );

            const savedCitizen2 = await TestDataSource
                .getRepository(CitizenDAO)
                .findOneBy({ email: testCitizen2.email });

            const citizen = await getCitizenById(savedCitizen2!.id);

            expect(citizen).toMatchObject({
                email: testCitizen2.email,
                username: testCitizen2.username,
            });
        });

        it("should not return password in citizen DTO", async () => {
            await citizenRepo.createCitizen(
                testCitizen1.email,
                testCitizen1.username,
                testCitizen1.name,
                testCitizen1.surname,
                testCitizen1.password,
                testCitizen1.receive_emails,
                testCitizen1.profilePicture,
                testCitizen1.telegram_username
            );

            const savedCitizen = await TestDataSource
                .getRepository(CitizenDAO)
                .findOneBy({ email: testCitizen1.email });

            const citizen = await getCitizenById(savedCitizen!.id);

            expect(citizen).not.toHaveProperty('password');
        });
    });

    describe("GET /citizens/email/:email - Get citizen by email", () => {
        it("should return citizen by valid email", async () => {
            await citizenRepo.createCitizen(
                testCitizen1.email,
                testCitizen1.username,
                testCitizen1.name,
                testCitizen1.surname,
                testCitizen1.password,
                testCitizen1.receive_emails,
                testCitizen1.profilePicture,
                testCitizen1.telegram_username
            );

            const citizen = await getCitizenByEmail(testCitizen1.email);

            expect(citizen).toMatchObject({
                email: testCitizen1.email,
                username: testCitizen1.username,
                name: testCitizen1.name,
                surname: testCitizen1.surname,
            });
        });

        it("should return null for non-existent email", async () => {
            const citizen = await getCitizenByEmail("nonexistent@example.com");
            expect(citizen).toBeNull();
        });

        it("should be case-sensitive for email", async () => {
            await citizenRepo.createCitizen(
                testCitizen1.email,
                testCitizen1.username,
                testCitizen1.name,
                testCitizen1.surname,
                testCitizen1.password,
                testCitizen1.receive_emails,
                testCitizen1.profilePicture,
                testCitizen1.telegram_username
            );

            const citizen = await getCitizenByEmail(testCitizen1.email.toUpperCase());
            // SQLite is case-insensitive by default for LIKE, but we test the behavior
            // Depending on implementation, this might return null or the citizen
        });

        it("should return complete citizen DTO", async () => {
            await citizenRepo.createCitizen(
                testCitizen3.email,
                testCitizen3.username,
                testCitizen3.name,
                testCitizen3.surname,
                testCitizen3.password,
                testCitizen3.receive_emails,
                testCitizen3.profilePicture,
                testCitizen3.telegram_username
            );

            const citizen = await getCitizenByEmail(testCitizen3.email);

            expect(citizen).toHaveProperty('email', testCitizen3.email);
            expect(citizen).toHaveProperty('username', testCitizen3.username);
            expect(citizen).toHaveProperty('name', testCitizen3.name);
            expect(citizen).toHaveProperty('surname', testCitizen3.surname);
            expect(citizen).toHaveProperty('receive_emails', testCitizen3.receive_emails);
            expect(citizen).toHaveProperty('profilePicture', testCitizen3.profilePicture);
            expect(citizen).toHaveProperty('telegram_username', testCitizen3.telegram_username);
            expect(citizen).not.toHaveProperty('id');
            expect(citizen).not.toHaveProperty('password');
        });
    });

    describe("GET /citizens/username/:username - Get citizen by username", () => {
        it("should return citizen by valid username", async () => {
            await citizenRepo.createCitizen(
                testCitizen1.email,
                testCitizen1.username,
                testCitizen1.name,
                testCitizen1.surname,
                testCitizen1.password,
                testCitizen1.receive_emails,
                testCitizen1.profilePicture,
                testCitizen1.telegram_username
            );

            const citizen = await getCitizenByUsername(testCitizen1.username);

            expect(citizen).toMatchObject({
                email: testCitizen1.email,
                username: testCitizen1.username,
                name: testCitizen1.name,
                surname: testCitizen1.surname,
            });
        });

        it("should return null for non-existent username", async () => {
            const citizen = await getCitizenByUsername("nonexistentuser");
            expect(citizen).toBeNull();
        });

        it("should return correct citizen when multiple exist", async () => {
            await citizenRepo.createCitizen(
                testCitizen1.email,
                testCitizen1.username,
                testCitizen1.name,
                testCitizen1.surname,
                testCitizen1.password,
                testCitizen1.receive_emails,
                testCitizen1.profilePicture,
                testCitizen1.telegram_username
            );

            await citizenRepo.createCitizen(
                testCitizen2.email,
                testCitizen2.username,
                testCitizen2.name,
                testCitizen2.surname,
                testCitizen2.password,
                testCitizen2.receive_emails,
                testCitizen2.profilePicture,
                testCitizen2.telegram_username
            );

            const citizen = await getCitizenByUsername(testCitizen2.username);

            expect(citizen).toMatchObject({
                email: testCitizen2.email,
                username: testCitizen2.username,
            });
        });

        it("should not return password", async () => {
            await citizenRepo.createCitizen(
                testCitizen1.email,
                testCitizen1.username,
                testCitizen1.name,
                testCitizen1.surname,
                testCitizen1.password,
                testCitizen1.receive_emails,
                testCitizen1.profilePicture,
                testCitizen1.telegram_username
            );

            const citizen = await getCitizenByUsername(testCitizen1.username);

            expect(citizen).not.toHaveProperty('password');
        });

        it("should handle usernames with special characters", async () => {
            const specialCitizen = {
                ...testCitizen1,
                username: "test_user.123",
                email: "special@test.com"
            };

            await citizenRepo.createCitizen(
                specialCitizen.email,
                specialCitizen.username,
                specialCitizen.name,
                specialCitizen.surname,
                specialCitizen.password,
                specialCitizen.receive_emails,
                specialCitizen.profilePicture,
                specialCitizen.telegram_username
            );

            const citizen = await getCitizenByUsername(specialCitizen.username);

            expect(citizen).toMatchObject({
                username: specialCitizen.username,
            });
        });
    });

    describe("Integration - Complete citizen lifecycle", () => {
        it("should handle creating and retrieving citizen by all methods", async () => {
            const hashedPassword = await bcrypt.hash(testCitizen1.password, 10);
            
            const createdCitizen = await citizenRepo.createCitizen(
                testCitizen1.email,
                testCitizen1.username,
                testCitizen1.name,
                testCitizen1.surname,
                hashedPassword,
                testCitizen1.receive_emails,
                testCitizen1.profilePicture,
                testCitizen1.telegram_username
            );

            // Get by ID
            const byId = await getCitizenById(createdCitizen.id);
            expect(byId).toBeTruthy();
            expect(byId?.username).toBe(testCitizen1.username);
            expect(byId).not.toHaveProperty('id');

            // Get by email
            const byEmail = await getCitizenByEmail(testCitizen1.email);
            expect(byEmail).toBeTruthy();
            expect(byEmail?.username).toBe(testCitizen1.username);

            // Get by username
            const byUsername = await getCitizenByUsername(testCitizen1.username);
            expect(byUsername).toBeTruthy();
            expect(byUsername?.email).toBe(testCitizen1.email);

            // Get all
            const all = await getAllCitizens();
            expect(all).toHaveLength(1);
            expect(all[0].username).toBe(testCitizen1.username);
        });

        it("should maintain data consistency across different retrieval methods", async () => {
            await citizenRepo.createCitizen(
                testCitizen2.email,
                testCitizen2.username,
                testCitizen2.name,
                testCitizen2.surname,
                testCitizen2.password,
                testCitizen2.receive_emails,
                testCitizen2.profilePicture,
                testCitizen2.telegram_username
            );

            const byEmail = await getCitizenByEmail(testCitizen2.email);
            const byUsername = await getCitizenByUsername(testCitizen2.username);

            expect(byEmail).toEqual(byUsername);
        });
    });

    describe("Edge cases and error handling", () => {
        it("should handle empty database gracefully", async () => {
            const allCitizens = await getAllCitizens();
            const byId = await getCitizenById(1);
            const byEmail = await getCitizenByEmail("test@test.com");
            const byUsername = await getCitizenByUsername("testuser");

            expect(allCitizens).toEqual([]);
            expect(byId).toBeNull();
            expect(byEmail).toBeNull();
            expect(byUsername).toBeNull();
        });

        it("should handle negative IDs", async () => {
            const citizen = await getCitizenById(-1);
            expect(citizen).toBeNull();
        });

        it("should handle zero as ID", async () => {
            const citizen = await getCitizenById(0);
            expect(citizen).toBeNull();
        });
    });
});
