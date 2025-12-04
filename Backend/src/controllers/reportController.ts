import {ReportFilters, ReportRepository} from "@repositories/reportRepository";
import {CitizenRepository} from "@repositories/citizenRepository";
import {NotFoundError} from "@errors/NotFoundError";
import {BadRequestError} from "@errors/BadRequestError";
import {ReportDAO, Status} from "@dao/reportDAO";
import multer from "multer";
import fs from "fs";
import path from "path";
import { mapMessageToDTO, mapReportDAOToDTO } from "@services/mapperService";
import { Report } from "@models/dto/Report";
import { OfficeCategory } from "@models/dao/officeDAO";
import {findOrThrowNotFound} from "@utils";
import {StaffDAO} from "@dao/staffDAO";
import { Message } from "@models/dto/Message";

const repo = new ReportRepository();
const citizenRepo = new CitizenRepository();

const reportStorage = multer.diskStorage({
    destination: (req, file, cb) => {
        const uploadDir = './uploads/reports';
        if (!fs.existsSync(uploadDir)) {
            fs.mkdirSync(uploadDir, { recursive: true });
        }
        cb(null, uploadDir);
    },
    filename: (req, file, cb) => {
        const uniqueName = `${Date.now()}-${Math.random().toString(36).substring(7)}${path.extname(file.originalname)}`;
        cb(null, uniqueName);
    }
});

export const uploadReportPictures = multer({
    storage: reportStorage,
    limits: {
        fileSize: 5 * 1024 * 1024, // 5MB per file
        fieldSize: 25 * 1024 * 1024, // 25MB per field
        files: 3 // max 3 files
    },
    fileFilter: (req, file, cb) => {
        const allowedTypes = /jpeg|jpg|png/;
        const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
        const mimetype = allowedTypes.test(file.mimetype);
        if (extname && mimetype) {
            cb(null, true);
        } else {
            cb(new BadRequestError('Only JPEG, JPG, and PNG images are allowed'));
        }
    }
});

export async function createReport(body: any, citizen: string, photos: Express.Multer.File[]): Promise<ReportDAO> {
    const {
        title,
        description,
        category,
        latitude,
        longitude,
        anonymous
    } = body;

    const citizenDAO = await citizenRepo.getCitizenByUsername(citizen);

    if (!citizenDAO) {
        throw new NotFoundError(`Current session's citizen with username: ${citizen} not found`);
    }

    if (!title || !description || !category || latitude === undefined || longitude === undefined) {
        throw new BadRequestError("Missing required fields");
    }

    if (!photos || photos.length <= 0) {
        throw new BadRequestError("At least one photo is required");
    }
    const photo1 = `/uploads/reports/${photos[0].filename}`;
    const photo2 = photos[1] ? `/uploads/reports/${photos[1].filename}` : undefined;
    const photo3 = photos[2] ? `/uploads/reports/${photos[2].filename}` : undefined;

    const isAnonymous = anonymous === 'true' || anonymous === true;
    const lat = parseFloat(latitude);
    const lon = parseFloat(longitude);

    //TODO: must be inside Turin perimeter

    return await repo.create(
        citizenDAO,
        title,
        description,
        category,
        lat,
        lon,
        isAnonymous,
        photo1,
        photo2,
        photo3
    );
}

export async function getReports(filters?: ReportFilters): Promise<Report[]> {
    const reportDAOs = await repo.getReports(filters);
    return reportDAOs.map(mapReportDAOToDTO);
}

export async function getMapReports(): Promise<Report[]> {
    const reportDAOs = await repo.getMapReports();
    return reportDAOs.map(mapReportDAOToDTO);
}

export async function getReportById(reportId: number): Promise<Report> {
    const reportDAO = await repo.getReportById(reportId);
    return mapReportDAOToDTO(reportDAO);
}

export async function updateReportAsMPRO(reportId: number, updatedStatus: Status, comment?: string, updatedCategory?: OfficeCategory): Promise<Report> {
    const updatedReportDAO = await repo.updateReportAsMPRO(reportId, updatedStatus, comment, updatedCategory);
    return mapReportDAOToDTO(updatedReportDAO);
}

export async function selfAssignReport(reportId: number, staffUsername: string): Promise<Report> {
    const updatedReportDAO = await repo.selfAssignReport(reportId, staffUsername);
    return mapReportDAOToDTO(updatedReportDAO);
}

export async function updateReportAsTOSM(reportId: number, updatedStatus: Status, staffUsername: string, comment?: string): Promise<Report> {
    const updatedReportDAO = await repo.updateReportAsTOSM(reportId, updatedStatus, staffUsername, comment);
    return mapReportDAOToDTO(updatedReportDAO);
}

export async function assignReportToEM(reportId: number, emUsername: string, staffUsername: string): Promise<Report> {
    const updatedReportDAO = await repo.assignEMToReport(reportId, emUsername, staffUsername);
    return mapReportDAOToDTO(updatedReportDAO);
}

export async function addMessageToReport(reportId: number, username: string, userType: 'CITIZEN' | 'STAFF', message: string): Promise<Report> {
    const reportDAO = findOrThrowNotFound(
        [await repo.getReportById(reportId)],
        () => true,
        `Report with id ${reportId} not found`
    );

    let assignedStaff: StaffDAO | undefined = undefined;
    if (userType === 'STAFF') {
        if(reportDAO.assignedStaff?.username !== username)
            throw new BadRequestError(`Staff member ${username} is not assigned to report ${reportId}`);
        assignedStaff = reportDAO.assignedStaff;
    } else if (userType === 'CITIZEN' && reportDAO.citizen?.username !== username) {
        throw new BadRequestError(`Citizen ${username} is not the owner of report ${reportId}`);
    }

    const updatedReportDAO = await repo.addMessageToReport(reportDAO, message, assignedStaff);

    return mapReportDAOToDTO(updatedReportDAO);
}

export async function getAllMessages(reportId: number): Promise<Message[]> {
    const reportDAO = findOrThrowNotFound(
        [await repo.getReportById(reportId)],
        () => true,
        `Report with id ${reportId} not found`
    );
    const messages = await repo.getAllMessages(reportDAO.id);
    return messages.map(mapMessageToDTO);
}