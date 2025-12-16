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

export interface Report {
    id: number;
    citizenUsername?: string;
    timestamp?: string | Date; 
    status: string;
    title: string;
    description: string;
    category: OfficeCategory | string;
    coordinates?: number[];
    photos?: string[];
    comment?: string;
    assignedStaff?: string;
    assignedEM?: string;
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

