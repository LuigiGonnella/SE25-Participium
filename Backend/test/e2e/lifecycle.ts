import { TestDataSource } from "../setup/test-datasource";
import { CitizenDAO } from "@dao/citizenDAO";
import { StaffDAO } from "@dao/staffDAO";
import { CitizenRepository } from "@repositories/citizenRepository";
import { AppDataSource } from "@database";
import bcrypt from "bcrypt";

export const TEST_CITIZENS = {
    citizen1: {
        email: "john.doe@example.com",
        username: "johndoe",
        name: "John",
        surname: "Doe",
        password: "password123",
        receive_emails: true,
        profilePicture: "/uploads/profiles/john.jpg",
        telegram_username: "@johndoe",
    },
    citizen2: {
        email: "jane.smith@example.com",
        username: "janesmith",
        name: "Jane",
        surname: "Smith",
        password: "securepass456",
        receive_emails: false,
        profilePicture: "",
        telegram_username: "",
    },
    citizen3: {
        email: "bob.wilson@example.com",
        username: "bobwilson",
        name: "Bob",
        surname: "Wilson",
        password: "bobpass789",
        receive_emails: true,
        profilePicture: "/uploads/profiles/bob.jpg",
        telegram_username: "@bobwilson",
    }
};

/**
 * Initialize test database and seed with test data
 */
export async function beforeAllE2e(): Promise<void> {
    // Initialize TestDataSource if not already initialized
    if (!TestDataSource.isInitialized) {
        await TestDataSource.initialize();
        // Make AppDataSource point to TestDataSource for the tests
        Object.assign(AppDataSource, TestDataSource);
    }

    // Clear existing data
    await TestDataSource.getRepository(CitizenDAO).clear();
    await TestDataSource.getRepository(StaffDAO).clear();

    // Seed test citizens
    const citizenRepo = new CitizenRepository();
    
    for (const testCitizen of Object.values(TEST_CITIZENS)) {
        const hashedPassword = await bcrypt.hash(testCitizen.password, 10);
        await citizenRepo.createCitizen(
            testCitizen.email,
            testCitizen.username,
            testCitizen.name,
            testCitizen.surname,
            hashedPassword,
            testCitizen.receive_emails,
            testCitizen.profilePicture || undefined,
            testCitizen.telegram_username || undefined
        );
    }
}

/**
 * Clean up test database
 */
export async function afterAllE2e(): Promise<void> {
    if (TestDataSource.isInitialized) {
        await TestDataSource.getRepository(CitizenDAO).clear();
        await TestDataSource.getRepository(StaffDAO).clear();
        await TestDataSource.destroy();
    }
}

/**
 * Clear data between tests
 */
export async function beforeEachE2e(): Promise<void> {
    await TestDataSource.getRepository(CitizenDAO).clear();
    await TestDataSource.getRepository(StaffDAO).clear();
}
