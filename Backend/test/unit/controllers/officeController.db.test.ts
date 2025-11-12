import { OfficeRepository } from "@repositories/officeRepository";
import { OfficeCategory, OfficeDAO } from "@dao/officeDAO";
import { initializeTestDataSource, closeTestDataSource, TestDataSource } from "../../setup/test-datasource";
import { OfficeController } from "@controllers/officeController";
import { Request, Response } from "express";

let officeRepo: OfficeRepository;

const fakeOfficeDAO = {
    name: "City Planning Office",
    description: "Handles urban planning and development",
    category: OfficeCategory.MOO,
};

const expectedOfficeDTO = {
    name: fakeOfficeDAO.name,
    description: fakeOfficeDAO.description,
    category: fakeOfficeDAO.category,
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
});

describe("OfficeController - test suite", () => {
    it("tests createOffice - success", async () => {
        const req = {
            body: {
                name: fakeOfficeDAO.name,
                description: fakeOfficeDAO.description,
                category: fakeOfficeDAO.category,
            },
        } as Request;

        const res = {
            status: jest.fn().mockReturnThis(),
            json: jest.fn(),
        } as unknown as Response;

        await OfficeController.createOffice(req, res);

        expect(res.status).toHaveBeenCalledWith(201);
        expect(res.json).toHaveBeenCalledWith({
            message: "Office created successfully",
            office: expect.objectContaining(expectedOfficeDTO),
        });
    });

    it("tests createOffice - missing name only", async () => {
        const req = {
            body: {
                description: fakeOfficeDAO.description,
                category: fakeOfficeDAO.category,
            },
        } as Request;

        const res = {
            status: jest.fn().mockReturnThis(),
            json: jest.fn(),
        } as unknown as Response;

        await OfficeController.createOffice(req, res);

        expect(res.status).toHaveBeenCalledWith(400);
        expect(res.json).toHaveBeenCalledWith({
            message: "Name and category are required",
        });
    });

    it("tests createOffice - missing category only", async () => {
        const req = {
            body: {
                name: fakeOfficeDAO.name,
                description: fakeOfficeDAO.description,
            },
        } as Request;

        const res = {
            status: jest.fn().mockReturnThis(),
            json: jest.fn(),
        } as unknown as Response;

        await OfficeController.createOffice(req, res);

        expect(res.status).toHaveBeenCalledWith(400);
        expect(res.json).toHaveBeenCalledWith({
            message: "Name and category are required",
        });
    });

    it("tests createOffice - duplicate office triggers AppError", async () => {
        await officeRepo.createOffice(
            fakeOfficeDAO.name,
            fakeOfficeDAO.description,
            fakeOfficeDAO.category
        );

        const req = {
            body: {
                name: "Another Office",
                description: "Another description",
                category: fakeOfficeDAO.category,
            },
        } as Request;

        const res = {
            status: jest.fn().mockReturnThis(),
            json: jest.fn(),
        } as unknown as Response;

        await OfficeController.createOffice(req, res);

        expect(res.status).toHaveBeenCalled();
        expect(res.json).toHaveBeenCalledWith({
            message: expect.stringContaining("Office"),
        });
    });

    it("tests createOffice - missing required fields", async () => {
        const req = {
            body: {
                description: fakeOfficeDAO.description,
            },
        } as Request;

        const res = {
            status: jest.fn().mockReturnThis(),
            json: jest.fn(),
        } as unknown as Response;

        await OfficeController.createOffice(req, res);

        expect(res.status).toHaveBeenCalledWith(400);
        expect(res.json).toHaveBeenCalledWith({
            message: "Name and category are required",
        });
    });

    it("tests getAllOffices - empty database", async () => {
        const req = {} as Request;

        const res = {
            status: jest.fn().mockReturnThis(),
            json: jest.fn(),
        } as unknown as Response;

        await OfficeController.getAllOffices(req, res);

        expect(res.status).toHaveBeenCalledWith(200);
        expect(res.json).toHaveBeenCalledWith([]);
    });

    it("tests getAllOffices - with data", async () => {
        await officeRepo.createOffice(
            fakeOfficeDAO.name,
            fakeOfficeDAO.description,
            fakeOfficeDAO.category
        );

        const req = {} as Request;

        const res = {
            status: jest.fn().mockReturnThis(),
            json: jest.fn(),
        } as unknown as Response;

        await OfficeController.getAllOffices(req, res);

        expect(res.status).toHaveBeenCalledWith(200);
        expect(res.json).toHaveBeenCalledWith(
            expect.arrayContaining([
                expect.objectContaining(expectedOfficeDTO),
            ])
        );
    });

    it("tests getAllOffices - multiple offices", async () => {
        await officeRepo.createOffice(
            fakeOfficeDAO.name,
            fakeOfficeDAO.description,
            fakeOfficeDAO.category
        );

        await officeRepo.createOffice(
            "Environmental Office",
            "Manages environmental concerns",
            OfficeCategory.WSO
        );

        const req = {} as Request;

        const res = {
            status: jest.fn().mockReturnThis(),
            json: jest.fn(),
        } as unknown as Response;

        await OfficeController.getAllOffices(req, res);

        expect(res.status).toHaveBeenCalledWith(200);
        expect(res.json).toHaveBeenCalledWith(expect.arrayContaining([
            expect.objectContaining(expectedOfficeDTO),
            expect.objectContaining({
                name: "Environmental Office",
                description: "Manages environmental concerns",
                category: OfficeCategory.WSO,
            }),
        ]));
    });
});