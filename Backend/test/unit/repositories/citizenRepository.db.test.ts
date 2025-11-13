import { CitizenDAO } from "@dao/citizenDAO";
import { CitizenRepository } from "@repositories/citizenRepository";
import { initializeTestDataSource, closeTestDataSource, TestDataSource } from "../../setup/test-datasource";

let citizenRepo: CitizenRepository;

const citizen1 = {
    email: "barack.obama@example.com",
    username: "barackobama",
    name: "Barack",
    surname: "Obama",
    password: "securepassword",
    receive_emails: false,
    profilePicture: "",
    telegram_username: "",
};

const citizen2 = {
    email: "donald.trump@example.com",
    username: "donaldtrump",
    name: "Donald",
    surname: "Trump",
    password: "verybigpassword",
    receive_emails: true,
    profilePicture: "",
    telegram_username: "",
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

describe("CitizenRepository - test suite", () => {
    it("should create a new citizen", async () => {
        await citizenRepo.createCitizen(
            citizen1.email,
            citizen1.username,
            citizen1.name,
            citizen1.surname,
            citizen1.password,
            citizen1.receive_emails,
            citizen1.profilePicture,
            citizen1.telegram_username,
        );
        const savedInDB = await TestDataSource
            .getRepository(CitizenDAO)
            .findOneBy({ email: citizen1.email });
        expect(savedInDB).toEqual(expect.objectContaining(citizen1));
    });

    it("should get all citizens", async () => {
        await citizenRepo.createCitizen(
            citizen1.email,
            citizen1.username,
            citizen1.name,
            citizen1.surname,
            citizen1.password,
            citizen1.receive_emails,
            citizen1.profilePicture,
            citizen1.telegram_username,
        );
        await citizenRepo.createCitizen(
            citizen2.email,
            citizen2.username,
            citizen2.name,
            citizen2.surname,
            citizen2.password,
            citizen2.receive_emails,
            citizen2.profilePicture,
            citizen2.telegram_username,
        );
        const citizens = await citizenRepo.getAllCitizens();
        expect(citizens).toHaveLength(2);
        expect(citizens).toEqual(
            expect.arrayContaining([
                expect.objectContaining(citizen1),
                expect.objectContaining(citizen2),
            ])
        );
    });

    it("should get citizen by email", async () => {
        await citizenRepo.createCitizen(
            citizen1.email,
            citizen1.username,
            citizen1.name,
            citizen1.surname,
            citizen1.password,
            citizen1.receive_emails,
            citizen1.profilePicture,
            citizen1.telegram_username,
        );
        const citizen = await citizenRepo.getCitizenByEmail(citizen1.email);
        expect(citizen).toEqual(expect.objectContaining(citizen1));
    });

    it("should get citizen by username", async () => {
        await citizenRepo.createCitizen(
            citizen2.email,
            citizen2.username,
            citizen2.name,
            citizen2.surname,
            citizen2.password,
            citizen2.receive_emails,
            citizen2.profilePicture,
            citizen2.telegram_username,
        );
        const citizen = await citizenRepo.getCitizenByUsername(citizen2.username);
        expect(citizen).toEqual(expect.objectContaining(citizen2));
    });

    it("should get citizen by ID", async () => {
        await citizenRepo.createCitizen(
            citizen1.email,
            citizen1.username,
            citizen1.name,
            citizen1.surname,
            citizen1.password,
            citizen1.receive_emails,
            citizen1.profilePicture,
            citizen1.telegram_username,
        );
        const savedInDB = await TestDataSource
                    .getRepository(CitizenDAO)
                    .findOneBy({ email: citizen1.email });
        const citizen = await citizenRepo.getCitizenById(savedInDB!.id);
        expect(citizen).toEqual(expect.objectContaining(citizen1));
    });

});