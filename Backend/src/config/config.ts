import path from "node:path";

const DB_PATH = path.resolve(__dirname, '../../data/database.sqlite');
const APP_V1_BASE_URL = "/api/v1";
const URL_AUTH = "/auth";
const URL_CITIZENS = "/citizens";
const URL_OFFICES = "/offices";
const URL_STAFFS = "/staffs";
const URL_REPORTS = "/reports";
const URL_NOTIFICATIONS = "/notifications";


export const CONFIG = {
	APP_PORT: process.env.PORT || 8080,

	DB_TYPE: process.env.DB_TYPE || "sqlite",
	DB_HOST: process.env.DB_HOST || undefined,
	DB_PORT: process.env.DB_PORT ? Number.parseInt(process.env.DB_PORT) : undefined,
	DB_USERNAME: process.env.DB_USERNAME || undefined,
	DB_PASSWORD: process.env.DB_PASSWORD || undefined,
	DB_NAME: process.env.DB_NAME || DB_PATH,

	DB_ENTITIES: [
        path.join(__dirname, "../models/dao/*.ts"),
        path.join(__dirname, "../models/dao/*.js")  // per il codice compilato
    ],

	//SWAGGER_V1_FILE_PATH: path.resolve(__dirname, "../../doc/swagger_v1.yaml"),
	ROUTES: {
		// V1_SWAGGER: `${APP_V1_BASE_URL}/doc`,
		V1_AUTH: APP_V1_BASE_URL + URL_AUTH,
		V1_CITIZENS: APP_V1_BASE_URL + URL_CITIZENS,
		V1_OFFICES: APP_V1_BASE_URL + URL_OFFICES,
		V1_STAFFS: APP_V1_BASE_URL + URL_STAFFS,
		V1_REPORTS: APP_V1_BASE_URL + URL_REPORTS,
		V1_NOTIFICATIONS: APP_V1_BASE_URL + URL_NOTIFICATIONS
	},
	LOG_LEVEL: process.env.LOG_LEVEL || "info",
	LOG_PATH: process.env.LOG_PATH || "logs",
	ERROR_LOG_FILE: process.env.ERROR_LOG_FILE || "error.log",
	COMBINED_LOG_FILE: process.env.COMBINED_LOG_FILE || "combined.log",

	TELEGRAM_BOT_BEARER: process.env.TELEGRAM_BOT_BEARER || String.raw`O[A|dV(vPl#pl*W|y4\0oa=)E!YL+tX==\.@PkGXTvd#fT[AkV=t4zK}![|Oe!@m`
};
