import {register, uploadProfilePicture} from '@controllers/authController';
import {CitizenToJSON} from '@models/dto/Citizen';
import {Router} from "express";
import passport from 'passport';
import {isAuthenticated} from '@middlewares/authMiddleware';

const router = Router();

router.post('/register', uploadProfilePicture.single('profilePicture'), async (req, res, next) => {
    try {
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

router.post('/login', (req, res, next) => {
    const rawType = req.query.type;
    if (rawType !== 'CITIZEN' && rawType !== 'STAFF') {
        return res.status(400).json({ message: 'Invalid or missing query parameter: type' });
    }

    const strategy = rawType === 'CITIZEN' ? 'citizen-local' : 'staff-local';

    passport.authenticate(strategy, (err: any, user: any, info: any) => {
        if (err) return next(err);
        if (!user) return res.status(401).json({ message: info?.message || 'Authentication failed' });

        req.login(user, (err) => {
            if (err) return next(err);
            res.status(200).json(user);
        });
    })(req, res, next);
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
