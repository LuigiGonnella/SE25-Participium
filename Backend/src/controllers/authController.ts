import { CitizenRepository } from "@repositories/citizenRepository";
import bcrypt from 'bcrypt';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import {mapCitizenDAOToDTO, mapStaffDAOToDTO} from "@services/mapperService";
import { StaffRole } from '@models/dao/staffDAO';
import { StaffRepository } from "@repositories/staffRepository";
import {NotFoundError} from "@errors/NotFoundError";


// storage configuration
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        const uploadDir = './uploads/profiles';
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

// middleware to use in authRoutes
export const uploadProfilePicture = multer({
    storage,
    limits: { fileSize: 5 * 1024 * 1024 }, // 5MB max
    fileFilter: (req, file, cb) => {
        const allowedTypes = /jpeg|jpg|png/;
        const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
        const mimetype = allowedTypes.test(file.mimetype);
        if (extname && mimetype) {
            cb(null, true);
        } else {
            cb(new Error('Only images are allowed'));
        }
    }
});

export async function register(
    email: string,
    username: string,
    name: string,
    surname: string,
    password: string,
    receive_emails: boolean = false,
    profilePictureFile?: Express.Multer.File, // uploaded file
    telegram_username?: string
) {
    const citizenRepo = new CitizenRepository();
    const hashedPassword = await bcrypt.hash(password, 10);
    
    // image path
    const profilePicture = profilePictureFile 
        ? `/uploads/profiles/${profilePictureFile.filename}`
        : undefined;

    const citizenDAO = await citizenRepo.createCitizen(
        email,
        username,
        name,
        surname,
        hashedPassword,
        receive_emails,
        profilePicture,
        telegram_username
    );

    return mapCitizenDAOToDTO(citizenDAO);

}

export async function registerMunicipalityUser(
    username: string,
    name: string,
    surname: string,
    password: string,
    role: string,
    officeName: string
) {
    const staffRepo = new StaffRepository();
    const hashedPassword = await bcrypt.hash(password, 10);

    if (!(role in StaffRole)) {
        throw new NotFoundError(`Invalid staff role: ${role}`);
    }

    const validRole = StaffRole[role as keyof typeof StaffRole];

    const staffDAO = await staffRepo.createStaff(
        username,
        name,
        surname,
        hashedPassword,
        validRole,
        officeName,
    );

    return mapStaffDAOToDTO(staffDAO);
}
