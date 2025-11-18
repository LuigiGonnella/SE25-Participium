import {Router} from "express";
import {isAuthenticated} from "@middlewares/authMiddleware";
import {mapReportDAOToDTO} from "@services/mapperService";
import {createReport, uploadReportPictures, getReports, updateReport} from "@controllers/reportController";
import {Citizen} from "@dto/Citizen";
import { ReportFilters } from "@repositories/reportRepository";
import { BadRequestError } from "@errors/BadRequestError";
import { Status } from "@models/dao/reportDAO";
import { OfficeCategory } from "@models/dao/officeDAO";
import { StaffRole } from "@models/dao/staffDAO";

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
            filters.title = String(title).trim().replace(/_/g, ' ');
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
            
            const validStatus = Object.keys(Status)
                .filter(key => isNaN(Number(key)))
                .find(key => key.toUpperCase() === statusValue.toUpperCase());
           
            if (!validStatus) {
                throw new BadRequestError('Invalid status.');
            }
            filters.status = Status[validStatus as keyof typeof Status];
        }

        if (category) {
            const categoryValue = String(category);

            const validCategory = Object.keys(OfficeCategory)
                .filter(key => isNaN(Number(key)))
                .find(key => key.toUpperCase() === categoryValue.toUpperCase());
           
            if (!validCategory) {
                throw new BadRequestError('Invalid category.');
            }
            filters.category = OfficeCategory[validCategory as keyof typeof OfficeCategory];
        }

        const reports = await getReports(filters);
        res.status(200).json(reports);

    }
    catch(err) {
        next(err);
    }
});

// PATCH MPRO: changing category and status reports
router.patch('/:reportId', isAuthenticated([StaffRole.MPRO]), async (req, res, next) => {
    try {

        const reportId = parseInt(req.params.reportId);
        if (isNaN(reportId)) {
            throw new BadRequestError('Invalid reportId.');
        }

        const { status, comment, category, staff } = req.body;

        let updatedStatus: Status;
        let updatedCategory: OfficeCategory | undefined;
        let assignedStaffUsername: string | undefined;

        if (status) {
            const statusValue = String(status);           
            const validStatus = Object.keys(Status)
                .filter(key => isNaN(Number(key)))
                .find(key => key.toUpperCase() === statusValue.toUpperCase());
           
            if (!validStatus) {
                throw new BadRequestError('Invalid status.');
            }
            updatedStatus = Status[validStatus as keyof typeof Status];
        } else {
            throw new BadRequestError('Status is required.');
        }

        if (category) {
            const categoryValue = String(category);

            const validCategory = Object.keys(OfficeCategory)
                .filter(key => isNaN(Number(key)))
                .find(key => key.toUpperCase() === categoryValue.toUpperCase());
           
            if (!validCategory) {
                throw new BadRequestError('Invalid category.');
            }
            updatedCategory = OfficeCategory[validCategory as keyof typeof OfficeCategory];
        }

        if (staff) {
            assignedStaffUsername = String(staff).trim();
        }

        const report = await updateReport(reportId, updatedStatus, comment, updatedCategory, assignedStaffUsername);
        res.status(200).json(report);
    } catch (err) {
        next(err);
    }
});

// PATCH TOSM: self assignment of reports
router.patch('/:reportId', isAuthenticated([StaffRole.TOSM]), async (req, res, next) => {
    try {

        const reportId = parseInt(req.params.reportId);
        if (isNaN(reportId)) {
            throw new BadRequestError('Invalid reportId.');
        }

        const { status, comment, category, staff } = req.body;

        let updatedStatus: Status;
        let updatedCategory: OfficeCategory | undefined;
        let assignedStaffUsername: string | undefined;

        if (status) {
            const statusValue = String(status);           
            const validStatus = Object.keys(Status)
                .filter(key => isNaN(Number(key)))
                .find(key => key.toUpperCase() === statusValue.toUpperCase());
           
            if (!validStatus) {
                throw new BadRequestError('Invalid status.');
            }
            updatedStatus = Status[validStatus as keyof typeof Status];
        } else {
            throw new BadRequestError('Status is required.');
        }

        if (category) {
            const categoryValue = String(category);

            const validCategory = Object.keys(OfficeCategory)
                .filter(key => isNaN(Number(key)))
                .find(key => key.toUpperCase() === categoryValue.toUpperCase());
           
            if (!validCategory) {
                throw new BadRequestError('Invalid category.');
            }
            updatedCategory = OfficeCategory[validCategory as keyof typeof OfficeCategory];
        }

        if (staff) {
            assignedStaffUsername = String(staff).trim();
        }

        const report = await updateReport(reportId, updatedStatus, comment, updatedCategory, assignedStaffUsername);
        res.status(200).json(report);
    } catch (err) {
        next(err);
    }
});

export default router;