import {Router} from "express";
import {isAuthenticated, telegramBotAuth} from "@middlewares/authMiddleware";
import {mapReportDAOToDTO} from "@services/mapperService";
import {
    addMessageToReport,
    assignReportToEM,
    createReport,
    getAllMessages,
    getMapReports,
    getReportById,
    getReports,
    selfAssignReport,
    updateReportAsEM,
    updateReportAsMPRO,
    updateReportAsTOSM,
    uploadReportPictures
} from "@controllers/reportController";
import {Citizen} from "@dto/Citizen";
import {ReportFilters} from "@repositories/reportRepository";
import {BadRequestError} from "@errors/BadRequestError";
import {OfficeCategory} from "@models/dao/officeDAO";
import {StaffRole} from "@models/dao/staffDAO";
import {Staff} from "@dto/Staff";
import {getCitizenByTelegramUsername} from "@controllers/citizenController";
import {validateDate, validateOfficeCategory, validateReportId, validateStatus, validateStatusByRole} from "@utils";

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
            filters.fromDate = validateDate(fromDate, 'fromDate');
        }

        if (toDate) {
            filters.toDate = validateDate(toDate, 'toDate');
        }

        if (filters.fromDate && filters.toDate && filters.fromDate > filters.toDate) {
            throw new BadRequestError('fromDate cannot be after toDate.');
        }

        if (typeof status === 'string') {
            filters.status = validateStatus(status);
        }

        if (typeof category === 'string') {
            filters.category = validateOfficeCategory(category);
        }

        const reports = await getReports((req.user as Staff).username, filters);
        res.status(200).json(reports);

    }
    catch(err) {
        next(err);
    }
});

router.get('/public', isAuthenticated(['CITIZEN']), async (req, res, next) => {
    try{
        const reports = await getMapReports();
        res.status(200).json(reports);
    }
    catch(err) {
        next(err);
    }
});

router.get('/:reportId', isAuthenticated(['STAFF']), async (req, res, next) => {
    try {
        const reportId = validateReportId(req.params.reportId);

        const report = await getReportById(reportId);
        res.status(200).json(report);
    } catch (err) {
        next(err);
    }
});

// PATCH MPRO: change status, category and (optionally) assigned staff
router.patch('/:reportId/manage', isAuthenticated([StaffRole.MPRO]), async (req, res, next) => {
    try {
        const reportId = validateReportId(req.params.reportId);

        const { status, comment, category } = req.body;

        const updatedStatus = validateStatusByRole(status, StaffRole.MPRO, comment);

        let updatedCategory: OfficeCategory | undefined;
        if (category) {
            updatedCategory = validateOfficeCategory(category);
        }

        const report = await updateReportAsMPRO(reportId, updatedStatus, comment, updatedCategory);
        res.status(200).json(report);
    } catch (err) {
        next(err);
    }
});

// PATCH TOSM: self assignment of reports
router.patch("/:reportId/assignSelf", isAuthenticated([StaffRole.TOSM]), async (req, res, next) => {
    try {
        const reportId = validateReportId(req.params.reportId);

        const staffUsername = (req.user as Staff).username;

        const report = await selfAssignReport(reportId, staffUsername);

        res.status(200).json(report);
    } catch (err) {
        next(err);
      }
    }
    );

// PATCH TOSM: assignment reports to external maintainer
router.patch("/:reportId/assignExternal", isAuthenticated([StaffRole.TOSM]), async (req, res, next) => {
    try {
      const reportId = validateReportId(req.params.reportId);

      const staffUsername = (req.user as Staff).username;

      const { staffEM } = req.body;

      if (staffEM === undefined) {
        throw new BadRequestError('External maintainer username missing.');
      }

      const EM_Username = (staffEM as string).trim();

      const report = await assignReportToEM(reportId, EM_Username, staffUsername);

      res.status(200).json(report);
    } catch (err) {
      next(err);
    }
  }
);

// PATCH TOSM/EM: update status of reports
router.patch("/:reportId/updateStatus", isAuthenticated([StaffRole.TOSM, StaffRole.EM]), async (req, res, next) => {
    try {
      const reportId = validateReportId(req.params.reportId);

      const { status, comment } = req.body;

      const updatedStatus = validateStatusByRole(status, StaffRole.TOSM, comment);

      const staffUser = req.user as Staff

      const staffUsername = staffUser.username;

      let report;

      if (staffUser.role === StaffRole.TOSM) {
        report = await updateReportAsTOSM(reportId, updatedStatus, staffUsername, comment);
      } else if (staffUser.role === StaffRole.EM) {
        report = await updateReportAsEM(reportId, updatedStatus, staffUsername, comment);
      }

      res.status(200).json(report);
    } catch (err) {
      next(err);
    }
  }
);

// add message to report
router.post('/:reportId/messages', isAuthenticated(['CITIZEN', 'STAFF']), async (req, res, next) => {
    try {
        const user = req.user as ((Citizen | Staff) & { type: 'CITIZEN' | 'STAFF' });
        const reportId = validateReportId(req.params.reportId);

        const { message, isPrivate } = req.body;

        if (!message || typeof message !== 'string' || message.trim() === '') {
            throw new BadRequestError('Message cannot be empty.');
        }

        res.status(201).json(await addMessageToReport(reportId, user.username, user.type, message.trim(), isPrivate));
    } catch (err) {
        next(err);
    }
});

router.get('/:reportId/messages', isAuthenticated(['CITIZEN', 'STAFF']), async (req, res, next) => {
    try {
        const reportId = validateReportId(req.params.reportId);

        const user = req.user as ((Citizen | Staff) & { type: 'CITIZEN' | 'STAFF' });

        res.status(200).json(await getAllMessages(reportId, user.type));
    } catch (err) {
        next(err);
    }
});

router.post('/telegram', telegramBotAuth, uploadReportPictures.array("photos", 3), async (req, res, next) => {
    try {
        const photos = req.files as Express.Multer.File[];
        const citizen = (await getCitizenByTelegramUsername(req.body.telegram_username)).username;
        res.status(201).json(mapReportDAOToDTO(await createReport(req.body, citizen, photos)));
    } catch (err) {
        next(err);
    }
})

export default router;