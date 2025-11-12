import { CitizenRepository } from "@repositories/citizenRepository";
import bcrypt from 'bcrypt';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import {mapCitizenDAOToDTO, mapStaffDAOToDTO} from "@services/mapperService";
import { StaffRole } from '@models/dao/staffDAO';
import { StaffRepository } from "@repositories/staffRepository";
import { Request, Response, NextFunction } from 'express';
import passport from 'passport';
import AppError from "@models/errors/AppError";


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
    role: StaffRole,
    officeId?: number
) {
    const staffRepo = new StaffRepository();
    const hashedPassword = await bcrypt.hash(password, 10);

    const staffDAO = await staffRepo.createStaff(
        username,
        name,
        surname,
        hashedPassword,
        role,
        officeId,
    );

    return mapStaffDAOToDTO(staffDAO);

export async function login(req: Request, res: Response, next: NextFunction) {
    const rawType = req.query.type;
    
    if (rawType !== 'CITIZEN' && rawType !== 'STAFF') {
        throw new AppError('Invalid or missing query parameter', 400);
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
