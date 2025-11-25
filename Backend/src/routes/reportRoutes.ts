import {Router} from "express";
import {isAuthenticated} from "@middlewares/authMiddleware";
import {mapReportDAOToDTO} from "@services/mapperService";
import {createReport, uploadReportPictures} from "@controllers/reportController";
import {Citizen} from "@dto/Citizen";

const router = Router();

router.post('/', isAuthenticated(['CITIZEN']), uploadReportPictures.array("photos", 3), async (req, res, next) => {
    try {
        const photos = req.files as Express.Multer.File[];
        const citizen = (req.user as Citizen).username;
        res.status(201).json(mapReportDAOToDTO(await createReport(req.body, citizen, photos)));
    } catch (err) {
        next(err);
    }
});

export default router;