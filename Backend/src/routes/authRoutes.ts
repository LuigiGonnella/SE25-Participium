import {
    register,
    uploadProfilePicture,
    registerMunicipalityUser,
    login,
    verifyTelegramUser,
    createTelegramVerification,
    verifyEmailUser,
    createEmailVerification
} from '@controllers/authController';
import {Citizen, CitizenToJSON} from '@models/dto/Citizen';
import {Router} from "express";
import {isAuthenticated, telegramBotAuth} from '@middlewares/authMiddleware';
import { StaffToJSON } from '@models/dto/Staff';
import { StaffRole } from '@models/dao/staffDAO';
import { create } from 'domain';
import { getCitizenByUsername } from '@controllers/citizenController';

const router = Router();

router.post('/register', uploadProfilePicture.single('profilePicture'), async (req, res, next) => {
    try {
        // Validate required fields
        const { email, username, name, surname, password } = req.body;
        
        if (!email?.trim() || !email.includes('@')) {
            return res.status(400).json({ error: 'Invalid or missing email' });
        }
        if (!username?.trim()) {
            return res.status(400).json({ error: 'Invalid or missing username' });
        }
        if (!name?.trim()) {
            return res.status(400).json({ error: 'Invalid or missing name' });
        }
        if (!surname?.trim()) {
            return res.status(400).json({ error: 'Invalid or missing surname' });
        }
        if (!password?.trim()) {
            return res.status(400).json({ error: 'Invalid or missing password' });
        }
        const citizen = await register(
            email,
            username,
            name,
            surname,
            password,
            req.body.receive_emails,
            req.file, // multer puts file in req.file
            req.body.telegram_username
        );
        res.status(201).json(CitizenToJSON(citizen)); // does not expose password
    } catch (error) {
        next(error);
    }
});

router.post('/register-municipality', isAuthenticated([StaffRole.ADMIN]), async (req, res, next) => {
    try { //JSON request
        const staff = await registerMunicipalityUser(
            req.body.username,
            req.body.name,
            req.body.surname,
            req.body.password,
            req.body.role,
            req.body.officeNames
        );
        res.status(201).json(StaffToJSON(staff)); // does not expose password
    } catch (error) {
        next(error);
    }
});

router.post('/login', async (req, res, next) => {
    try {
        // Validate required fields
        const { username, password } = req.body;
        
        if (!username?.trim()) {
            return res.status(400).json({ error: 'Invalid or missing username' });
        }
        if (!password?.trim()) {
            return res.status(400).json({ error: 'Invalid or missing password' });
        }

        await login(req, res, next);
    } catch (error) {
        next(error);
    }
});

router.delete('/logout', (req, res) => {
    req.logout((err) => {
        if (err) {
            return res.status(500).json({ message: 'Logout failed' });
        }
        res.status(204).send();
    });
});

router.get('/me', isAuthenticated(['CITIZEN', 'STAFF']), (req, res) => {
    res.status(200).json(req.user);
});

router.post('/createTelegramVerification', isAuthenticated(['CITIZEN']), async (req, res, next) => {
    try {
        const user = req.user as Citizen;
        res.status(201).json({ code: await createTelegramVerification(user, req.body.username) });
    } catch (error) {
        next(error);
    }
});

router.post('/verifyTelegramUser', telegramBotAuth, async (req, res, next) => {
    try {
        const { username, code } = req.body;
        await verifyTelegramUser(username, code);
        res.status(201).send();
    } catch (error) {
        next(error);
    }
});

router.post('/verify-email', async (req, res, next) => {
    try {
        const { code } = req.body;

        if (!code?.trim()) {
            return res.status(400).json({ error: 'Invalid or missing verification code' });
        }

        await verifyEmailUser(code);
        res.status(200).json({ message: 'Email verified successfully' });
    } catch (error) {
        next(error);
    }
});

router.post('/resend-verification-email', isAuthenticated(['CITIZEN']), async (req, res, next) => {
    try {
        const user = req.user as Citizen;
        await createEmailVerification(user.username);
        res.status(200).json({ message: 'Verification email resent successfully' });
    } catch (error) {
        next(error);
    }   
});

export default router;
