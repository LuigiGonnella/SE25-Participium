import {Router} from "express";
import {isAuthenticated} from "@middlewares/authMiddleware";
import {StaffRole} from "@dao/staffDAO";
import {getAllEMStaff, getAllStaff} from "@controllers/staffController";

const router = Router();

router.get('/', isAuthenticated([StaffRole.ADMIN]), getAllStaff)

router.get('/', isAuthenticated([StaffRole.TOSM]), getAllEMStaff)