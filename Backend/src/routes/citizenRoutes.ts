import { Router } from "express";
import { CitizenToJSON } from "@models/dto/Citizen";
import { getAllCitizens, getCitizenByEmail, getCitizenById, getCitizenByUsername } from "@controllers/citizenController";

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

export default router;