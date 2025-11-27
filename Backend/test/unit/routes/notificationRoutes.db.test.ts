jest.mock("@middlewares/authMiddleware", () => ({
  isAuthenticated: jest.fn(() => {
    return (req: any, res: any, next: any) => {
      req.user = { username: "johnny", type: "CITIZEN" };
      next();
    };
  }),
}));

jest.mock("@controllers/notificationController", () => ({
  getNotificationsOfUser: jest.fn(),
  markNotificationAsRead: jest.fn(),
}));

jest.mock("@models/dto/Notification", () => ({
  NotificationToJSON: jest.fn((n: any) => ({
    id: n.id,
    title: n.title,
    message: n.message,
    isRead: n.isRead,
  })),
}));

import express from "express";
import request from "supertest";

import router from "@routes/notificationRoutes";
import { getNotificationsOfUser, markNotificationAsRead } from "@controllers/notificationController";
import { NotificationToJSON } from "@models/dto/Notification";

describe("Notification Routes", () => {
  let app: express.Express;

  beforeEach(() => {
    jest.clearAllMocks();
    app = express();
    app.use(express.json());
    app.use("/notifications", router);
  });

  describe("GET /notifications", () => {
    it("returns mapped notifications for authenticated user", async () => {
      const fakeList = [
        { id: 1, title: "T1", message: "M1", isRead: false },
        { id: 2, title: "T2", message: "M2", isRead: true },
      ];
      (getNotificationsOfUser as jest.Mock).mockResolvedValue(fakeList);

      const res = await request(app).get("/notifications");

      expect(res.status).toBe(200);
      expect(getNotificationsOfUser).toHaveBeenCalledWith({ username: "johnny", type: "CITIZEN" });
      expect(NotificationToJSON).toHaveBeenCalledTimes(2);
      expect(res.body).toEqual([
        { id: 1, title: "T1", message: "M1", isRead: false },
        { id: 2, title: "T2", message: "M2", isRead: true },
      ]);
    });

    it("propagates errors via next(err)", async () => {
      const err = new Error("Failed to load notifications");
      (getNotificationsOfUser as jest.Mock).mockRejectedValue(err);

      const appWithError = express();
      appWithError.use(express.json());
      appWithError.use("/notifications", router);

      const nextMock = jest.fn();
      appWithError.use((e: any, req: any, res: any, next: any) => {
        nextMock(e);
        res.status(500).json({ error: e.message });
      });

      const res = await request(appWithError).get("/notifications");

      expect(nextMock).toHaveBeenCalledWith(err);
      expect(res.status).toBe(500);
    });
  });

  describe("PATCH /notifications/:id/read", () => {
    it("marks notification as read when id is valid", async () => {
      (markNotificationAsRead as jest.Mock).mockResolvedValue(undefined);

      const res = await request(app).patch("/notifications/5/read");

      expect(res.status).toBe(200);
      expect(markNotificationAsRead).toHaveBeenCalledWith(5);
      expect(res.body).toEqual({ message: "Notification marked as read" });
    });

    it("propagates errors via next(err)", async () => {
      const err = new Error("Failed to mark as read");
      (markNotificationAsRead as jest.Mock).mockRejectedValue(err);

      const appWithError = express();
      appWithError.use(express.json());
      appWithError.use("/notifications", router);

      const nextMock = jest.fn();
      appWithError.use((e: any, req: any, res: any, next: any) => {
        nextMock(e);
        res.status(500).json({ error: e.message });
      });

      const res = await request(appWithError).patch("/notifications/10/read");

      expect(nextMock).toHaveBeenCalledWith(err);
      expect(res.status).toBe(500);
    });
  });
});

