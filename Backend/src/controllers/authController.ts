import { CitizenRepository } from "@repositories/citizenRepository";
import bcrypt from 'bcrypt';
import multer from 'multer';
import path from 'node:path';
import fs from 'node:fs';
import {mapCitizenDAOToDTO, mapStaffDAOToDTO} from "@services/mapperService";
import { StaffRole } from '@models/dao/staffDAO';
import { StaffRepository } from "@repositories/staffRepository";
import {NotFoundError} from "@errors/NotFoundError";
import { Request, Response, NextFunction } from 'express';
import passport from 'passport';
import {BadRequestError} from "@errors/BadRequestError";
import {PendingVerificationRepository} from "@repositories/pendingVerificationRepository";
import {Citizen} from "@dto/Citizen";
import { sendVerificationEmail } from "@services/emailService";

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

    // Create citizen WITHOUT email (will be set after verification)
    const citizenDAO = await citizenRepo.createCitizen(
        email,
        username,
        name,
        surname,
        hashedPassword,
        receive_emails
    );

    await createEmailVerification(citizenDAO.username, email);

    return mapCitizenDAOToDTO(citizenDAO);

}

export async function createEmailVerification(username: string, email?: string): Promise<void> {
    const pvRepo = new PendingVerificationRepository();
    const user = await new CitizenRepository().getCitizenByUsername(username);
    if(!user)
        throw new NotFoundError(`Citizen with username ${username} not found`);

    if(!email) {
        const existingVerifications = await pvRepo.getPendingVerification(user.id, "email");
        if(existingVerifications.expiresAt > new Date()) {
            // Code still valid
            throw new BadRequestError('A pending email verification already exists. Please check your email for the verification code.');
        }
        email = existingVerifications.valueToVerify; 
    }
    
    // Create pending verification for email
    const pendingVerification = await pvRepo.createPendingVerification(
        user,
        email,
        "email"
    );

    // Send verification email
    await sendVerificationEmail(email, user.name, pendingVerification.verificationCode);
}

export async function registerMunicipalityUser(
    username: string,
    name: string,
    surname: string,
    password: string,
    role: string,
    officeNames: string[]
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
        officeNames,
    );

    return mapStaffDAOToDTO(staffDAO);
}

export async function updateStaffOffices(req: Request, res: Response, next: NextFunction) {
    try {
        const username = String(req.params.username);

        const repo = new StaffRepository();
        const { offices, add, remove } = req.body;

        if (Array.isArray(offices)) {
            const updated = await repo.updateStaffOffices(username, offices);
            return res.status(200).json(mapStaffDAOToDTO(updated));
        }

        if (typeof add === "string") {
            const updated = await repo.addOfficeToStaff(username, add);
            return res.status(200).json(mapStaffDAOToDTO(updated));
        }

        if (typeof remove === "string") {
            const updated = await repo.removeOfficeFromStaff(username, remove);
            return res.status(200).json(mapStaffDAOToDTO(updated));
        }

        return res.status(400).json({
            message:
                "PATCH must contain { offices: [...] } or { add: 'officeName' } or { remove: 'officeName' }"
        });

    } catch (err) {
        next(err);
    }
}

export async function login(req: Request, res: Response, next: NextFunction) {
    const rawType = req.query.type;

    if (rawType !== 'CITIZEN' && rawType !== 'STAFF') {
        throw new BadRequestError('Invalid or missing query parameter');
    }

    const strategy = rawType === 'CITIZEN' ? 'citizen-local' : 'staff-local';

    passport.authenticate(strategy, (err: any, user: any, info: any) => {
        if (err) {
            return next(err);
        }

        if (!user) {
            return res.status(401).json({
                message: info?.message || 'Authentication failed',
                error: 'Invalid credentials'
            });
        }

        req.login(user, (err) => {
            if (err) {
                return next(err);
            }

            return res.status(200).json(user);
        });
    })(req, res, next);
}

export async function createTelegramVerification(user: Citizen, username: string): Promise<string> {
    const citizen = await new CitizenRepository().getCitizenByUsername(user.username);
    if(!citizen)
        throw new NotFoundError(`Citizen with username ${user.username} not found`);
    const pvRepo = new PendingVerificationRepository();
    return (await pvRepo.createPendingVerification(citizen, username, "telegram")).verificationCode;
}

export async function verifyTelegramUser(username: string, code: string): Promise<void> {
    if (!username?.trim()) {
        throw new BadRequestError('Invalid or missing telegram username');
    }
    const pvRepo = new PendingVerificationRepository();
    await pvRepo.verifyPendingVerification(username, code, "telegram");
}

export async function verifyEmailUser(code: string): Promise<void> {
    if (!code?.trim()) {
        throw new BadRequestError('Invalid or missing verification code');
    }
    const pvRepo = new PendingVerificationRepository();
    await pvRepo.verifyPendingVerification("", code, "email");
}