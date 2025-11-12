import {register, uploadProfilePicture, registerMunicipalityUser, login} from '@controllers/authController';
import {CitizenToJSON} from '@models/dto/Citizen';
import {Router} from "express";
import passport from 'passport';
import {isAuthenticated} from '@middlewares/authMiddleware';
import { StaffToJSON } from '@models/dto/Staff';
import { StaffRole } from '@models/dao/staffDAO';

const router = Router();

router.post('/register', uploadProfilePicture.single('profilePicture'), async (req, res, next) => {
    try { //form-data request
        const citizen = await register(
            req.body.email,
            req.body.username,
            req.body.name,
            req.body.surname,
            req.body.password,
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
            req.body.officeId ? req.body.officeId : undefined
        );
        res.status(201).json(StaffToJSON(staff)); // does not expose password
    } catch (error) {
        next(error);
    }
});

router.post('/login', async (req, res, next) => {
    try {
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

export default router;
