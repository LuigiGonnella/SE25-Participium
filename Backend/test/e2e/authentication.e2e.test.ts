import { initializeTestDataSource, closeTestDataSource, TestDataSource } from "../setup/test-datasource";
import { CitizenDAO } from "@dao/citizenDAO";
import { register } from "@controllers/authController";
import bcrypt from "bcrypt";

beforeAll(async () => {
  await initializeTestDataSource();
});

afterAll(async () => {
  await closeTestDataSource();
});

beforeEach(async () => {
  await TestDataSource.getRepository(CitizenDAO).clear();
});

describe("Auth E2E – Citizen Registration", () => {
  it("should register a new citizen successfully", async () => {
    const citizen = await register(
      "newuser@example.com",
      "newuser",
      "New",
      "User",
      "password123",
      true,
      undefined,
      "@newuser"
    );

    expect(citizen).toBeTruthy();
    expect(citizen.email).toBe("newuser@example.com");
    expect(citizen.username).toBe("newuser");

    const savedCitizen = await TestDataSource.getRepository(CitizenDAO).findOneBy({
      email: "newuser@example.com",
    });
    expect(savedCitizen).toBeTruthy();
    expect(savedCitizen?.email).toBe("newuser@example.com");
    expect(savedCitizen?.password).not.toBe("password123"); // must be hashed
  });

  it("should throw an error when required fields are missing", async () => {
    await expect(
      register("", "nouser", "", "", "password123")
    ).rejects.toThrow();
  });

  it("should throw an error when username already exists", async () => {
    // First successful registration
    await register(
      "dup@example.com",
      "dupuser",
      "Dup",
      "User",
      "password123",
      false
    );

    // Second one with same username
    await expect(
      register(
        "dup2@example.com",
        "dupuser", // duplicate username
        "Dup2",
        "User2",
        "password123",
        false
      )
    ).rejects.toThrow();
  });

  it("should hash the password before saving", async () => {
    const citizen = await register(
      "hashcheck@example.com",
      "hashuser",
      "Hash",
      "User",
      "plainpassword",
      true
    );

    const savedCitizen = await TestDataSource.getRepository(CitizenDAO).findOneBy({
      email: "hashcheck@example.com",
    });

    expect(savedCitizen).toBeTruthy();
    expect(savedCitizen?.password).not.toBe("plainpassword");
    const isMatch = await bcrypt.compare("plainpassword", savedCitizen!.password);
    expect(isMatch).toBe(true);
  });

  it("should allow registration without a profile picture", async () => {
    const citizen = await register(
      "nopic@example.com",
      "nopicuser",
      "No",
      "Pic",
      "password123",
      false,
      undefined,
      ""
    );

    const savedCitizen = await TestDataSource.getRepository(CitizenDAO).findOneBy({
      email: "nopic@example.com",
    });

    expect(savedCitizen).toBeTruthy();
    expect(savedCitizen?.profilePicture === null || savedCitizen?.profilePicture === undefined).toBe(true);
  });
});
