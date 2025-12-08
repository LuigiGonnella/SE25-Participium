import {Router} from "express";
import {isAuthenticated} from "@middlewares/authMiddleware";
import {StaffRole} from "@dao/staffDAO";
import {getAllEMStaff, getAllStaff, getAllTOSM} from "@controllers/staffController";
import {updateStaffOffices} from "@controllers/authController";

const router = Router();

router.get('/', isAuthenticated([StaffRole.ADMIN]), getAllStaff)

router.get('/external', isAuthenticated([StaffRole.TOSM]), getAllEMStaff)

router.patch(
    '/:username/offices',
    isAuthenticated([StaffRole.ADMIN]),
    (req, res, next) => updateStaffOffices(req, res, next)
);

router.get(
    '/tosm',
    isAuthenticated([StaffRole.ADMIN]),
    (req, res) => getAllTOSM(req, res)
);

export default router;