export interface Citizen {
    id: number;
    email: string;
    username: string;
    name: string;
    surname: string;
    password: string;
    profilePicture?: string;
    telegram_username?: string;
    receive_emails: boolean;
    type: string;
}

export interface Staff {
    id: number;
    email: string;
    username: string;
    name: string;
    surname: string;
    password: string;
    role: string;
    officeName: string;
    type: string;
}

export interface Credentials {
    username: string;
    password: string;
}

export interface NewCitizen {
    name: string;
    surname: string;
    username: string;
    email: string;
    receive_emails: boolean;
    password: string;}

export interface NewStaff {
    name: string;
    surname: string;
    username: string;
    password: string;
    role: string;
    officeName: string;
}

export const StaffRole = {
    ADMIN: "Admin",
    MPRO: "Municipal Public Relations Officer",
    MA: "Municipal Administrator",
    TOSM: "Technical Office Staff Member"
}

export interface Office {
    id: number;
    name: string;
    category: string;
}

export const OfficeCategory = {
    MOO: "Municipal Organization Office",
    WSO: "Water Supply Office",
    ABO: "Architectural Barriers Office",
    SSO: "Sewer System Office",
    PLO: "Public Lighting Office",
    WO: "Waste Office",
    RSTLO: "Road Signs and Traffic Lights Office",
    RUFO: "Roads and Urban Furnishings Office",
    PGAPO: "Public Green Areas and Playgrounds Office",
}

export const ROLE_OFFICE_MAP: Record<string, string[]> = {
    ADMIN: ['MOO'],
    MPRO: ['MOO'],
    MA: ['MOO'],
    TOSM: ['WSO', 'ABO', 'SSO', 'PLO', 'WO', 'RSTLO', 'RUFO', 'PGAPO'],
};