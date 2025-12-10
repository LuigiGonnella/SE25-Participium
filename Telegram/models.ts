import {Context} from "telegraf";

export enum OfficeCategory {
    WSO = "Water Supply",
    ABO = "Architectural Barriers",
    SSO = "Sewer System",
    PLO = "Public Lighting",
    WO = "Waste",
    RSTLO = "Road Signs and Traffic Lights",
    RUFO = "Roads and Urban Furnishings",
    PGAPO = "Public Green Areas and Playgrounds",
    MOO = "Other"
}

interface SessionData {
    isVerified: boolean;
    step: string | null;
    title?: string;
    description?: string;
    latitude?: number;
    longitude?: number;
    category?: string;
    photos?: string[];
    anonymous?: boolean;
}

export const defaultSession: SessionData = {
    isVerified: false,
    step: null,
    title: undefined,
    description: undefined,
    latitude: undefined,
    longitude: undefined,
    category: undefined,
    photos: [],
}

export interface ParticipiumContext extends Context {
    session: SessionData;
}