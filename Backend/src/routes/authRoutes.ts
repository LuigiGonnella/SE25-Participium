import {uploadProfilePicture, register, getToken} from '@controllers/authController';
import { CitizenToJSON } from '@models/dto/Citizen';
import {Router} from "express";
import {authenticateUser} from "@middlewares/authMiddleware";
import {getLoggedUser} from "@services/authService";

const router = Router();

router.post('/register', uploadProfilePicture.single('profilePicture'), async (req, res, next) => {
    try {
        const citizen = await register(
            req.body.email,
            req.body.username,
            req.body.name,
            req.body.surname,
            req.body.password,
            req.body.receive_emails === 'true', // from string to boolean
            req.file, // multer puts file in req.file
            req.body.telegram_username
        );
        res.status(201).json(CitizenToJSON(citizen)); // does not expose password
    } catch (error) {
        next(error);
    }
});

router.post('/sessions', async (req, res, next) => {
    try {
        const rawType = req.query.type;
        if (rawType !== 'CITIZEN' && rawType !== 'STAFF') {
            return res.status(400).json({ message: 'Invalid or missing query parameter: type' });
        }
        const type = rawType as 'CITIZEN' | 'STAFF';
        res.status(200).json(await getToken(req.body, type));
    } catch (error) {
        next(error);
    }
});

router.get('/sessions/current', authenticateUser([]), async (req, res, next) => {
    try {
        res.status(200).json(await getLoggedUser(req.headers.authorization));
    } catch (error) {
        next(error);
    }
})

export default router;
