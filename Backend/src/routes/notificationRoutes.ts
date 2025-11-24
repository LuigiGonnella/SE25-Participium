import { Router } from "express";
import { isAuthenticated } from "@middlewares/authMiddleware";
import { getNotificationsOfUser, markNotificationAsRead } from "@controllers/notificationController";
import { NotificationToJSON } from "@models/dto/Notification";

const router = Router();

router.get("/", isAuthenticated(), async (req, res, next) => {
    try {
        const list = await getNotificationsOfUser(req.user);
        res.status(200).json(list.map(NotificationToJSON));
    } catch (err) {
        next(err);
    }
});

router.patch("/:id/read", isAuthenticated(), async (req, res, next) => {
    try {
        await markNotificationAsRead(Number(req.params.id));
        res.status(200).json({ message: "Notification marked as read" });
    } catch (err) {
        next(err);
    }
});

export default router;