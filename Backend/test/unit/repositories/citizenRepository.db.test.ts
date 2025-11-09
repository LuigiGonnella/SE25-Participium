import { before } from "node:test";
import { DataSource } from "typeorm";
import { CitizenDAO } from "@dao/citizenDAO";

let dataSource: DataSource;

const citizen1 = {
    email: "barack.obama@example.com",
    username: "barackobama",
    name: "Barack",
    surname: "Obama",
    password: "securepassword",
    receive_emails: false,
};

const citizen2 = {
    email: "donald.trump@example.com",
    username: "donaldtrump",
    name: "Donald",
    surname: "Trump",
    password: "verybigpassword",
    receive_emails: true,
};

beforeAll(async () => {
    dataSource = new DataSource({
        type: "sqlite",
        database: ":memory:",
        synchronize: true,
        logging: false,
        entities: [CitizenDAO],
    });
    await dataSource.initialize();

    const citizenRepo = dataSource.getRepository(CitizenDAO);
    await citizenRepo.save([citizen1, citizen2]);
});

afterAll(async () => {
    await dataSource.destroy();
});

describe("CitizenRepository - test suite", () => {
    it("should get all citizens", async () => {
        const citizenRepo = dataSource.getRepository(CitizenDAO);
        const citizens = await citizenRepo.find();
        expect(citizens).toHaveLength(2);
        expect(citizens).toEqual(
            expect.arrayContaining([
                expect.objectContaining(citizen1),
                expect.objectContaining(citizen2),
            ])
        );
    });

    it("should get citizen by ID", async () => {
        const citizenRepo = dataSource.getRepository(CitizenDAO);
        const citizen = await citizenRepo.findOne({ where: { username: "barackobama" } });
        expect(citizen).toEqual(expect.objectContaining(citizen1));
    });

    it("should get citizen by email", async () => {
        const citizenRepo = dataSource.getRepository(CitizenDAO);
        const citizen = await citizenRepo.findOne({ where: { email: "barack.obama@example.com" } });
        expect(citizen).toEqual(expect.objectContaining(citizen1));
    });

    it("should get citizen by username", async () => {
        const citizenRepo = dataSource.getRepository(CitizenDAO);
        const citizen = await citizenRepo.findOne({ where: { username: "donaldtrump" } });
        expect(citizen).toEqual(expect.objectContaining(citizen2));
    });

    it("should create a new citizen", async () => {
        const citizenRepo = dataSource.getRepository(CitizenDAO);
        const newCitizen = {
            email: "joe.clinton@example.com",
            username: "joebiden",
            name: "Joe",
            surname: "Biden",
            password: "oldpassword",
            receive_emails: true,
        };
        await citizenRepo.save(newCitizen);
        const savedCitizen = await citizenRepo.findOne({ where: { username: "joebiden" } });
        expect(savedCitizen).toEqual(expect.objectContaining(newCitizen));
    });
});