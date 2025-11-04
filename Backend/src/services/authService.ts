import jwt from "jsonwebtoken";
import { SECRET_KEY, TOKEN_LIFESPAN } from "@config";
import AppError from "@models/errors/AppError";
import { InsufficientRightsError } from "@models/errors/InsufficientRightsError";
import { UnauthorizedError } from "@models/errors/UnauthorizedError";
import {Citizen as CitizenDTO} from "@dto/Citizen";
import {Staff as StaffDTO, StaffRole} from "@dto/Staff";
import {StaffRepository} from "@repositories/staffRepository";
import {CitizenRepository} from "@repositories/citizenRepository";
import {mapCitizenDAOToDTO, mapStaffDAOToDTO} from "@services/mapperService";

type UserWithType = (CitizenDTO & { type: 'CITIZEN' }) | (StaffDTO & { type: 'STAFF' });

export function generateCitizenToken(user: CitizenDTO): string {
    return jwt.sign({...user, type: 'CITIZEN'}, SECRET_KEY, { expiresIn: TOKEN_LIFESPAN });
}

export function generateStaffToken(user: StaffDTO): string {
    return jwt.sign({...user, type: 'STAFF'}, SECRET_KEY, { expiresIn: TOKEN_LIFESPAN });
}

export async function processToken(
    authHeader?: string,
    allowedRoles: StaffRole[] = []
) {
    const user = verifyToken(authHeader);
    if (user.type === 'STAFF') {
        const staffRepo = new StaffRepository();
        const staffDAO = await staffRepo.getStaffByUsername(user.username);
        if (!staffDAO)
            throw new UnauthorizedError(
                `Unauthorized: user ${user.username} not found`
            );
        if (allowedRoles.length > 0 && (staffDAO.role && !allowedRoles.includes(staffDAO.role) || !staffDAO.role)) {
            throw new InsufficientRightsError("Forbidden: Insufficient rights");
        }
        return;
    } else if (user.type === 'CITIZEN') {
        if (allowedRoles.length > 0)
            throw new InsufficientRightsError("Forbidden: Insufficient rights");
        const citizenRepo = new CitizenRepository();
        const citizenDAO = await citizenRepo.getCitizenByUsername(user.username);
        if (!citizenDAO)
            throw new UnauthorizedError(
                `Unauthorized: user ${user.username} not found`
            );
        return;
    }
}

export async function getLoggedUser(
    authHeader?: string
): Promise<CitizenDTO | StaffDTO> {
    const user = verifyToken(authHeader);
    if (user.type === 'STAFF') {
        const staffRepo = new StaffRepository();
        const staffDAO = await staffRepo.getStaffByUsername(user.username);
        if (!staffDAO)
            throw new UnauthorizedError(
                `Unauthorized: user ${user.username} not found`
            );
        return mapStaffDAOToDTO(staffDAO);
    } else if (user.type === 'CITIZEN') {
        const citizenRepo = new CitizenRepository();
        const citizenDAO = await citizenRepo.getCitizenByUsername(user.username);
        if (!citizenDAO)
            throw new UnauthorizedError(
                `Unauthorized: user ${user.username} not found`
            );
        return mapCitizenDAOToDTO(citizenDAO);
    } else {
        throw new UnauthorizedError(
            `Unauthorized: user has invalid type`
        );
    }
}

function verifyToken(authHeader?: string): UserWithType {
    try {
        return jwt.verify(extractBearerToken(authHeader), SECRET_KEY) as UserWithType;
    } catch (error) {
        if (error instanceof AppError) {
            throw error;
        }
        const message = error instanceof Error ? error.message : String(error);
        throw new UnauthorizedError(`Unauthorized: ${message}`);
    }
}

function extractBearerToken(authHeader?: string): string {
    if (!authHeader) {
        throw new UnauthorizedError("Unauthorized: No token provided");
    }

    const parts = authHeader.split(" ");
    if (parts.length !== 2 || parts[0] !== "Bearer") {
        throw new UnauthorizedError("Unauthorized: Invalid token format");
    }

    return parts[1];
}
