import express from "express";
import swaggerUi from "swagger-ui-express";
import { CONFIG } from "@config";
import { errorHandler } from "@middlewares/errorMiddleware";
import cors from "cors";
import path from 'path';
import authenticationRouter from '@routes/authRoutes'
import citizenRouter from '@routes/citizenRoutes';
import officeRoutes from "@routes/officeRoutes";
import "reflect-metadata";
import session from 'express-session';
import passport from 'passport';
import { configurePassport } from '@config/passport';

export const app = express();

// we make the uploads folder public to make sure the client can access to see images in frontend
app.use('/uploads', express.static(path.join(__dirname, '..', 'uploads')));


app.use(express.json());
app.use(cors({
    origin: 'http://localhost:5173',
    credentials: true
}));

// Sessions
app.use(session({
    secret: process.env.SESSION_SECRET || 'definitely-not-a-secret-key',
    resave: false,
    saveUninitialized: false,
    cookie: {
        sameSite: 'lax',
        secure: process.env.NODE_ENV === 'production',
        httpOnly: true,
        maxAge: 1000 * 60 * 60 * 24 // 24h
    }
}));

// Passport
app.use(passport.initialize());
app.use(passport.session());
configurePassport();

// app.use(
//   CONFIG.ROUTES.V1_SWAGGER,
//   swaggerUi.serve,
//   swaggerUi.setup(YAML.load(CONFIG.SWAGGER_V1_FILE_PATH))
// );

// app.use(
//     OpenApiValidator.middleware({
//     // use the same absolute path used by swagger-ui so the validator
//     // can always find the spec regardless of current working directory
//     apiSpec: CONFIG.SWAGGER_V1_FILE_PATH,
//         validateApiSpec: true,
//         validateRequests: true,
//     })
// )

// Add routes here
app.use(CONFIG.ROUTES.V1_AUTH, authenticationRouter);
app.use(CONFIG.ROUTES.V1_CITIZENS, citizenRouter);
app.use(CONFIG.ROUTES.V1_OFFICES, officeRoutes);




//This must always be the last middleware added
app.use(errorHandler);


