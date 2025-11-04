import { uploadProfilePicture, register } from '@controllers/authController';
import { CitizenToJSON } from '@models/dto/Citizen';
import {Router} from "express";

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

export default router;