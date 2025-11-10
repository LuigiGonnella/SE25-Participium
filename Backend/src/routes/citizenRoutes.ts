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
        const citizen = await getCitizenByUsername(username);
        res.status(200).json(CitizenToJSON(citizen));
    } catch (error) {
        next(error);
    }
});

export default router;