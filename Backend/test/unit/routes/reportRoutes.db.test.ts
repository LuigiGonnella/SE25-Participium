jest.mock("@middlewares/authMiddleware", () => ({
    isAuthenticated: jest.fn(() => {
        return (req: any, res: any, next: any) => {
            req.user = { username: "johnny" };
            next();
        };
    }),
}));

jest.mock("@controllers/reportController", () => ({
    uploadReportPictures: {
        array: jest.fn(() => {
            return (req: any, res: any, next: any) => {
                req.files = [{ filename: "photo.jpg" }];
                next();
            };
        }),
    },
    createReport: jest.fn(),
}));

jest.mock("@services/mapperService", () => ({
    mapReportDAOToDTO: jest.fn(),
}));

import request from "supertest";
import express, { Request, Response, NextFunction } from "express";

import router from "@routes/reportRoutes";
import { createReport } from "@controllers/reportController";
import { mapReportDAOToDTO } from "@services/mapperService";

describe("Report Routes Test Suite", () => {
    let app: express.Express;

    beforeEach(() => {
        jest.clearAllMocks();

        app = express();
        app.use(express.json());
        app.use("/reports", router);
    });

    it("creates a report successfully", async () => {
        const fakeDAO = {
            id: 1,
            title: "Broken Light",
            photo1: "/uploads/reports/photo.jpg",
        };

        (createReport as jest.Mock).mockResolvedValue(fakeDAO);
        (mapReportDAOToDTO as jest.Mock).mockReturnValue({
            id: 1,
            title: "Broken Light",
        });

        const res = await request(app)
            .post("/reports")
            .send({
                title: "Broken Light",
                description: "desc",
                category: "Road Signs and Traffic Lights",
                latitude: "45",
                longitude: "7",
                anonymous: false,
            });

        expect(res.status).toBe(201);
        expect(createReport).toHaveBeenCalled();
        expect(mapReportDAOToDTO).toHaveBeenCalledWith(fakeDAO);
        expect(res.body).toEqual({ id: 1, title: "Broken Light" });
    });

    it("calls next(err) when createReport fails", async () => {
        const err = new Error("fail");
        (createReport as jest.Mock).mockRejectedValue(err);

        const nextMock = jest.fn();

        const appWithNext = express();
        appWithNext.use(express.json());
        appWithNext.use("/reports", router);

        appWithNext.use((e: any, req: any, res: any, next: any) => {
            nextMock(e);
            res.status(500).json({ error: e.message });
        });

        await request(appWithNext)
            .post("/reports")
            .send({
                title: "x",
                description: "x",
                category: "Road Signs and Traffic Lights",
                latitude: "45",
                longitude: "7",
            });

        expect(nextMock).toHaveBeenCalledWith(err);
    });
});