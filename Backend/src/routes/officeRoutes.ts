import { Router } from "express";
import { OfficeController } from "@controllers/officeController";
import { isAuthenticated } from "@middlewares/authMiddleware";
import { StaffRole } from "@models/dao/staffDAO";

const router = Router();

/**
 * POST /api/offices
 * Only ADMIN (Organization Office staff) can create new offices
 */
/*
router.post(
  "/",
  isAuthenticated([StaffRole.ADMIN]),
  OfficeController.createOffice
);*/

/**
 * (Optional) GET /api/offices
 * Allows ADMIN to view all offices
 */
router.get(
  "/",
  isAuthenticated([StaffRole.ADMIN]),
  OfficeController.getAllOffices
);

export default router;
