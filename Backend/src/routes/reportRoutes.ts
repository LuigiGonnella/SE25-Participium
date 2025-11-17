import {Router} from "express";
import {isAuthenticated} from "@middlewares/authMiddleware";
import {mapReportDAOToDTO} from "@services/mapperService";
import {createReport, uploadReportPictures, getReports} from "@controllers/reportController";
import {Citizen} from "@dto/Citizen";
import { Report, ReportToJSON } from "@models/dto/Report";
import { ReportFilters } from "@repositories/reportRepository";
import { BadRequestError } from "@errors/BadRequestError";
import { Status } from "@models/dao/reportDAO";
import { OfficeCategory } from "@models/dao/officeDAO";

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

router.get('/', isAuthenticated(['STAFF']), async (req, res, next) => {
    try{
        const { citizen_username,
                fromDate,
                toDate,
                status,
                title,
                category,
                staff_username } = req.query;

        const filters: ReportFilters = {};

        if (citizen_username) {
            filters.citizen_username = String(citizen_username).trim();
        }

        if (title) {
            filters.title = String(title).trim();
        }

        if (staff_username) {
            filters.staff_username = String(staff_username).trim();
        }

        if (fromDate && !toDate || !fromDate && toDate) {
            throw new BadRequestError('Both fromDate and toDate must be provided together.');
        }

        if (fromDate) {
            const date = new Date(String(fromDate));
            if (isNaN(date.getTime())) {
                throw new BadRequestError('Invalid fromDate format.');
            }
            filters.fromDate = date;
        }

        if (toDate) {
            const date = new Date(String(toDate));
            if (isNaN(date.getTime())) {
                throw new BadRequestError('Invalid toDate format.');
            }
            filters.toDate = date;
        }

        if (filters.fromDate && filters.toDate && filters.fromDate > filters.toDate) {
            throw new BadRequestError('fromDate cannot be after toDate.');
        }

        if (status) {
            const statusValue = String(status);
            if (!Object.values(Status).includes(statusValue as Status)) {
                throw new BadRequestError('Invalid status.');
            }
            filters.status = statusValue as Status;
        }

        if (category) {
            const categoryValue = String(category);
            if (!Object.values(OfficeCategory).includes(categoryValue as OfficeCategory)) {
                throw new BadRequestError('Invalid category.');
            }
            filters.category = categoryValue as OfficeCategory;
        }

        const reports = await getReports(filters);
        res.status(200).json(reports);

    }
    catch(err) {
        next(err);
    }
});

export default router;