jest.mock("@middlewares/authMiddleware", () => ({
    isAuthenticated: jest.fn((roles?: string[]) => {
        return (req: any, res: any, next: any) => {
            req.user = { username: "johnny", role: roles?.[0] || "CITIZEN" };
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
    getReports: jest.fn(),
    getReportById: jest.fn(),
    updateReportAsMPRO: jest.fn(),
    updateReportAsTOSM: jest.fn(),
}));

jest.mock("@services/mapperService", () => ({
    mapReportDAOToDTO: jest.fn(),
}));

import request from "supertest";
import express from "express";
import router from "@routes/reportRoutes";
import { createReport, getReports, getReportById, updateReportAsMPRO, updateReportAsTOSM } from "@controllers/reportController";
import { mapReportDAOToDTO } from "@services/mapperService";

describe("Report Routes", () => {
    let app: express.Express;

    beforeEach(() => {
        jest.clearAllMocks();

        app = express();
        app.use(express.json());
        app.use("/reports", router);
    });

    describe("POST /reports", () => {
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
        });

        it("handles errors from createReport", async () => {
            (createReport as jest.Mock).mockRejectedValue(new Error("Creation failed"));

            const res = await request(app)
                .post("/reports")
                .send({
                    title: "Test",
                    description: "Test description",
                    category: "Road Signs and Traffic Lights",
                    latitude: "45",
                    longitude: "7",
                });

            expect(res.status).toBe(500);
        });
    });

    describe("GET /reports", () => {
        it("returns all reports without filters", async () => {
            const mockReports = [
                { id: 1, title: "Report 1" },
                { id: 2, title: "Report 2" },
            ];

            (getReports as jest.Mock).mockResolvedValue(mockReports);

            const res = await request(app).get("/reports");

            expect(res.status).toBe(200);
            expect(res.body).toEqual(mockReports);
            expect(getReports).toHaveBeenCalledWith({});
        });

        it("filters reports by citizen_username", async () => {
            (getReports as jest.Mock).mockResolvedValue([{ id: 1 }]);

            const res = await request(app).get("/reports?citizen_username=testuser");

            expect(res.status).toBe(200);
            expect(getReports).toHaveBeenCalledWith({ citizen_username: "testuser" });
        });

        it("filters reports by status", async () => {
            (getReports as jest.Mock).mockResolvedValue([{ id: 1 }]);

            const res = await request(app).get("/reports?status=PENDING");

            expect(res.status).toBe(200);
            expect(getReports).toHaveBeenCalled();
        });

        it("filters reports by category", async () => {
            (getReports as jest.Mock).mockResolvedValue([{ id: 1 }]);

            const res = await request(app).get("/reports?category=WSO");

            expect(res.status).toBe(200);
            expect(getReports).toHaveBeenCalled();
        });

        it("rejects invalid status", async () => {
            const res = await request(app).get("/reports?status=INVALID_STATUS");

            expect(res.status).toBe(400);
        });

        it("rejects invalid category", async () => {
            const res = await request(app).get("/reports?category=INVALID_CATEGORY");

            expect(res.status).toBe(400);
        });

        it("rejects when only fromDate is provided", async () => {
            const res = await request(app).get("/reports?fromDate=2024-01-01");

            expect(res.status).toBe(400);
        });

        it("rejects when fromDate is after toDate", async () => {
            const res = await request(app).get("/reports?fromDate=2024-12-01&toDate=2024-01-01");

            expect(res.status).toBe(400);
        });
    });

    describe("GET /reports/:reportId", () => {
        it("returns a report by id", async () => {
            const mockReport = { id: 1, title: "Report" };
            (getReportById as jest.Mock).mockResolvedValue(mockReport);

            const res = await request(app).get("/reports/1");

            expect(res.status).toBe(200);
            expect(res.body).toEqual(mockReport);
            expect(getReportById).toHaveBeenCalledWith(1);
        });

        it("rejects invalid reportId", async () => {
            const res = await request(app).get("/reports/invalid");

            expect(res.status).toBe(400);
        });

        it("handles NotFoundError", async () => {
            (getReportById as jest.Mock).mockRejectedValue(new Error("Not found"));

            const res = await request(app).get("/reports/9999");

            expect(res.status).toBe(500);
        });
    });

    describe("PATCH /reports/:reportId/manage (MPRO)", () => {
        it("updates report status to ASSIGNED", async () => {
            const mockReport = { id: 1, status: "ASSIGNED" };
            (updateReportAsMPRO as jest.Mock).mockResolvedValue(mockReport);

            const res = await request(app)
                .patch("/reports/1/manage")
                .send({ status: "ASSIGNED" });

            expect(res.status).toBe(200);
            expect(updateReportAsMPRO).toHaveBeenCalled();
        });

        it("updates report status to REJECTED with comment", async () => {
            const mockReport = { id: 1, status: "REJECTED", comment: "Reason" };
            (updateReportAsMPRO as jest.Mock).mockResolvedValue(mockReport);

            const res = await request(app)
                .patch("/reports/1/manage")
                .send({ status: "REJECTED", comment: "Reason" });

            expect(res.status).toBe(200);
            expect(updateReportAsMPRO).toHaveBeenCalled();
        });

        it("rejects invalid reportId", async () => {
            const res = await request(app)
                .patch("/reports/NaN/manage")
                .send({ status: "ASSIGNED" });

            expect(res.status).toBe(400);
        });

        it("rejects missing status", async () => {
            const res = await request(app)
                .patch("/reports/1/manage")
                .send({});

            expect(res.status).toBe(400);
        });

        it("rejects REJECTED without comment", async () => {
            const res = await request(app)
                .patch("/reports/1/manage")
                .send({ status: "REJECTED" });

            expect(res.status).toBe(400);
        });

        it("rejects invalid status for MPRO", async () => {
            const res = await request(app)
                .patch("/reports/1/manage")
                .send({ status: "IN_PROGRESS" });

            expect(res.status).toBe(400);
        });
    });

    describe("PATCH /reports/:reportId/work (TOSM)", () => {
        it("updates report status to IN_PROGRESS", async () => {
            const mockReport = { id: 1, status: "IN_PROGRESS" };
            (updateReportAsTOSM as jest.Mock).mockResolvedValue(mockReport);

            const res = await request(app)
                .patch("/reports/1/work")
                .send({ status: "IN_PROGRESS" });

            expect(res.status).toBe(200);
            expect(updateReportAsTOSM).toHaveBeenCalled();
        });

        it("updates report status to RESOLVED with comment", async () => {
            const mockReport = { id: 1, status: "RESOLVED", comment: "Fixed" };
            (updateReportAsTOSM as jest.Mock).mockResolvedValue(mockReport);

            const res = await request(app)
                .patch("/reports/1/work")
                .send({ status: "RESOLVED", comment: "Fixed" });

            expect(res.status).toBe(200);
            expect(updateReportAsTOSM).toHaveBeenCalled();
        });

        it("rejects invalid reportId", async () => {
            const res = await request(app)
                .patch("/reports/abc/work")
                .send({ status: "IN_PROGRESS" });

            expect(res.status).toBe(400);
        });

        it("rejects missing status", async () => {
            const res = await request(app)
                .patch("/reports/1/work")
                .send({});

            expect(res.status).toBe(400);
        });

        it("rejects staff parameter", async () => {
            const res = await request(app)
                .patch("/reports/1/work")
                .send({ status: "IN_PROGRESS", staff: "otheruser" });

            expect(res.status).toBe(400);
        });

        it("rejects comment for non-RESOLVED status", async () => {
            const res = await request(app)
                .patch("/reports/1/work")
                .send({ status: "IN_PROGRESS", comment: "Comment" });

            expect(res.status).toBe(400);
        });

        it("rejects invalid status for TOSM", async () => {
            const res = await request(app)
                .patch("/reports/1/work")
                .send({ status: "ASSIGNED" });

            expect(res.status).toBe(400);
        });
    });
});
