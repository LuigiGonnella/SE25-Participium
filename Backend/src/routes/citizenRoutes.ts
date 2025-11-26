import { Router } from "express";
import { CitizenToJSON } from "@models/dto/Citizen";
import { getAllCitizens, getCitizenByEmail, getCitizenById, getCitizenByUsername, updateCitizenProfile, uploadProfilePicture } from "@controllers/citizenController";
import { isAuthenticated } from "@middlewares/authMiddleware";

const router = Router();

// GET /citizens - get all citizens
router.get('/', async (req, res, next) => {
    try {
        const citizens = await getAllCitizens();
        res.status(200).json(citizens.map(CitizenToJSON));
    } catch (error) {
        next(error);
    }
});

// GET /citizens/id/:id - get citizen by ID
router.get('/id/:id', async (req, res, next) => {
    try {
        const id = parseInt(req.params.id);
        // If id is not a valid number, return 400 Bad Request
        if (isNaN(id)) {
            return res.status(400).json({ error: 'Invalid ID parameter' });
        }
        const citizen = await getCitizenById(id);
        res.status(200).json(CitizenToJSON(citizen));
    } catch (error) {
        next(error);
    }
});

// GET /citizens/email/:email - get citizen by email
router.get('/email/:email', async (req, res, next) => {
    try {
        const email = req.params.email;
        // Basic email validation
        if (!email || email.trim() === '' || !email.includes('@')) {
            return res.status(400).json({ error: 'Invalid email parameter' });
        }
        const citizen = await getCitizenByEmail(email);
        res.status(200).json(CitizenToJSON(citizen));
    } catch (error) {
        next(error);
    }
});

// GET /citizens/username/:username - get citizen by username
router.get('/username/:username', async (req, res, next) => {
    try {
        const username = req.params.username;
        // Basic username validation
        if (!username || username.trim() === '') {
            return res.status(400).json({ error: 'Invalid username parameter' });
        }
        const citizen = await getCitizenByUsername(username);
        res.status(200).json(CitizenToJSON(citizen));
    } catch (error) {
        next(error);
    }
});

// PATCH /citizens/:username - update citizen profile (authenticated citizens only, can only update own profile)
router.patch('/:username', isAuthenticated(['CITIZEN']), uploadProfilePicture.single('profilePicture'), async (req, res, next) => {
    try {
        const username = req.params.username;
        const authenticatedUser = req.user as any;

        // Verify that the citizen can only update their own profile
        if (authenticatedUser.username !== username) {
            return res.status(403).json({ error: 'You can only update your own profile' });
        }

        // Extract update fields from request body
        const { telegram_username, receive_emails } = req.body;
        
        // Handle profile picture from multer upload
        const profilePictureFile = req.file as Express.Multer.File | undefined;
        const profilePicture = profilePictureFile 
            ? `/uploads/profiles/${profilePictureFile.filename}`
            : undefined;

        // Build updates object
        const updates: any = {};
        if (telegram_username !== undefined) updates.telegram_username = telegram_username;
        if (receive_emails !== undefined) updates.receive_emails = receive_emails === 'true' || receive_emails === true;
        if (profilePicture !== undefined) updates.profilePicture = profilePicture;

        // Update citizen profile
        const updatedCitizen = await updateCitizenProfile(username, updates);
        
        res.status(200).json(CitizenToJSON(updatedCitizen));
    } catch (error) {
        next(error);
    }
});

export default router;