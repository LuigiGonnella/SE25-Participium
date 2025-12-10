import type { Citizen as CitizenDTO } from "@models/dto/Citizen"
import { CitizenRepository } from "@repositories/citizenRepository"
import { mapCitizenDAOToDTO } from "@services/mapperService"
import multer from "multer";
import fs from "node:fs";
import path from "node:path";
import { BadRequestError } from "@errors/BadRequestError";
import {NotFoundError} from "@errors/NotFoundError";


export const citizenRepository = new CitizenRepository();

export async function getAllCitizens(): Promise<CitizenDTO[]> {
    const citizenDAOs = await citizenRepository.getAllCitizens();
    return citizenDAOs.map(mapCitizenDAOToDTO);
}

export async function getCitizenById(id: number): Promise<CitizenDTO | null> {
    const citizenDAO =  await citizenRepository.getCitizenById(id);
    if (!citizenDAO) {
        return null;
    }
    return mapCitizenDAOToDTO(citizenDAO);
}

export async function getCitizenByEmail(email: string): Promise<CitizenDTO | null> {
    const citizenDAO =  await citizenRepository.getCitizenByEmail(email);
    if (!citizenDAO) {
        return null;
    }
    return mapCitizenDAOToDTO(citizenDAO);
}

export async function getCitizenByUsername(username: string): Promise<CitizenDTO | null> {
    const citizenDAO =  await citizenRepository.getCitizenByUsername(username);
    if (!citizenDAO) {
        return null;
    }
    return mapCitizenDAOToDTO(citizenDAO);
}

const profileStorage = multer.diskStorage({
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

export const uploadProfilePicture = multer({
    storage: profileStorage,
    limits: {
        fileSize: 5 * 1024 * 1024
    },
    fileFilter: (req, file, cb) => {
        const allowedTypes = /jpeg|jpg|png/;
        const ext = path.extname(file.originalname).toLowerCase();
        if (!allowedTypes.test(ext)) {
            return cb(new BadRequestError("Only JPEG, JPG, PNG allowed"));
        }
        cb(null, true);
    }
});

export async function updateCitizenProfile(
    username: string,
    updates: {
        telegram_username?: string;
        receive_emails?: boolean;
        profilePicture?: string;
    }
) {
    const updatedDAO = await citizenRepository.updateCitizen(username, updates);
    return mapCitizenDAOToDTO(updatedDAO);
}

export async function getCitizenByTelegramUsername(telegram_username: string): Promise<CitizenDTO> {
    const citizenDAO =  await citizenRepository.getCitizenByTelegramUsername(telegram_username);
    if (!citizenDAO) {
        throw new NotFoundError("Citizen not found with the provided telegram username: " + telegram_username);
    }
    return mapCitizenDAOToDTO(citizenDAO);
}