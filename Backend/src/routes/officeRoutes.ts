import { Router } from "express";
import { OfficeController } from "@controllers/officeController";
import { isAuthenticated } from "@middlewares/authMiddleware";
import { StaffRole } from "@models/dao/staffDAO";

const router = Router();

router.get(
  "/",
  isAuthenticated([StaffRole.ADMIN]),
  OfficeController.getAllOffices
);

export default router;
