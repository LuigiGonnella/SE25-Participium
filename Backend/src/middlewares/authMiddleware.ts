import { processToken } from "@services/authService";
import { Request, Response, NextFunction } from "express";
import {StaffRole} from "@dto/Staff";

export function authenticateUser(allowedRoles: StaffRole[]) {
    return async (
        req: Request,
        res: Response,
        next: NextFunction
    ) => {
        try {
            await processToken(req.headers.authorization, allowedRoles);
            next();
        } catch (error) {
            next(error);
        }
    };
}