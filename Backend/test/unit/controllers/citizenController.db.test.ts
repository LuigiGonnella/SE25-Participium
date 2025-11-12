import { CitizenDAO } from "@dao/citizenDAO";
import { CitizenRepository } from "@repositories/citizenRepository";
import { initializeTestDataSource, closeTestDataSource, TestDataSource } from "../../setup/test-datasource";
import { getAllCitizens, getCitizenByEmail, getCitizenById, getCitizenByUsername } from "@controllers/citizenController";

let citizenRepo: CitizenRepository;

const fakeDAO = {
    email: "barack.obama@example.com",
    username: "barackobama",
    name: "Barack",
    surname: "Obama",
    password: "securepassword",
    receive_emails: false,
    profilePicture: "",
    telegram_username: "",
};

const expectedDTO = {
    email: fakeDAO.email,
    username: fakeDAO.username,
    name: fakeDAO.name,
    surname: fakeDAO.surname,
    receive_emails: fakeDAO.receive_emails,
    profilePicture: fakeDAO.profilePicture,
    telegram_username: fakeDAO.telegram_username,
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

describe("CitizenController - test suite", () => {
    it("tests getAllCitizen", async () => {
        await citizenRepo.createCitizen(
            fakeDAO.email,
            fakeDAO.username,
            fakeDAO.name,
            fakeDAO.surname,
            fakeDAO.password,
            fakeDAO.receive_emails,
            fakeDAO.profilePicture,
            fakeDAO.telegram_username,
        );
        const citizens = await getAllCitizens();
        expect(citizens).toEqual([expectedDTO]);
    });

    it("tests getCitizenByEmail", async () => {
        await citizenRepo.createCitizen(
            fakeDAO.email,
            fakeDAO.username,
            fakeDAO.name,
            fakeDAO.surname,
            fakeDAO.password,
            fakeDAO.receive_emails,
            fakeDAO.profilePicture,
            fakeDAO.telegram_username,
        );
        const citizen = await getCitizenByEmail(fakeDAO.email);
        expect(citizen).toEqual(expectedDTO);
    });

    it("tests getCitizenByUsername", async () => {
        await citizenRepo.createCitizen(
            fakeDAO.email,
            fakeDAO.username,
            fakeDAO.name,
            fakeDAO.surname,
            fakeDAO.password,
            fakeDAO.receive_emails,
            fakeDAO.profilePicture,
            fakeDAO.telegram_username,
        );
        const citizen = await getCitizenByUsername(fakeDAO.username);
        expect(citizen).toEqual(expectedDTO);
    });

    it("tests getCitizenById", async () => {
        await citizenRepo.createCitizen(
            fakeDAO.email,
            fakeDAO.username,
            fakeDAO.name,
            fakeDAO.surname,
            fakeDAO.password,
            fakeDAO.receive_emails,
            fakeDAO.profilePicture,
            fakeDAO.telegram_username,
        );
        const savedInDB = await TestDataSource
            .getRepository(CitizenDAO)
            .findOneBy({ email: fakeDAO.email });
        const citizen = await getCitizenById(savedInDB!.id);
        expect(citizen).toEqual(expectedDTO);
    });

});
