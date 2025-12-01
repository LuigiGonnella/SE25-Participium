import { Request, Response, NextFunction } from 'express';
import { StaffRole } from '@models/dao/staffDAO';
import {CONFIG} from "@config";

type AllowedRole = 'CITIZEN' | 'STAFF' | StaffRole;

export const isAuthenticated = (allowedRoles?: AllowedRole[]) => {
    return (req: Request, res: Response, next: NextFunction) => {
        if (!req.isAuthenticated()) {
            return res.status(401).json({ message: 'Not authenticated' });
        }

        if (!allowedRoles || allowedRoles.length === 0) {
            return next();
        }

        const user = req.user as any;
        const userType = user?.type;

        if (userType === 'CITIZEN') {
            if (allowedRoles.includes('CITIZEN')) {
                return next();
            }
            return res.status(403).json({ message: 'Forbidden: insufficient permissions' });
        }

        if (userType === 'STAFF') {
            if (allowedRoles.includes('STAFF')) {
                return next();
            }

            const staffRole = user?.role;
            if (staffRole && allowedRoles.includes(staffRole as StaffRole)) {
                return next();
            }

            return res.status(403).json({ message: 'Forbidden: insufficient permissions' });
        }

        res.status(403).json({ message: 'Forbidden: invalid user type' });
    };
};

export function telegramBotAuth(req: Request, res: Response, next: NextFunction) {
    const authHeader = req.headers['authorization'];

    if (!authHeader || authHeader !== `Bearer ${CONFIG.TELEGRAM_BOT_BEARER}`) {
        return res.status(403).json({ error: 'Forbidden' });
    }
    next();
}