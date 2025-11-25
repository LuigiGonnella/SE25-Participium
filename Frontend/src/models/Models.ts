export interface Citizen {
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
    email: string;
    username: string;
    name: string;
    surname: string;
    password: string;
    role: string;
    officeName: string;
    type: string;
}

export type User = Citizen | Staff;

export function isStaff(user: User | undefined): user is Staff {
    return user !== undefined && 'type' in user && user.type === 'STAFF';
}

export function isCitizen(user: User | undefined): user is Citizen {
    return user !== undefined && 'type' in user && user.type === 'CITIZEN';
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

export const ROLE_OFFICE_MAP = {
  ADMIN: ["Municipal Organization Office"],
  MPRO: ["Municipal Organization Office"],
  MA: ["Municipal Organization Office"],
  TOSM: [
    "Water Supply Office",
    "Architectural Barriers Office",
    "Sewer System Office",
    "Public Lighting Office",
    "Waste Office",
    "Road Signs and Traffic Lights Office",
    "Roads and Urban Furnishings Office",
    "Public Green Areas and Playgrounds Office"
  ]
};

// @ts-ignore
export enum OfficeCategory {
    MOO = "Municipal Organization",
    WSO = "Water Supply",
    ABO = "Architectural Barriers",
    SSO = "Sewer System",
    PLO = "Public Lighting",
    WO = "Waste",
    RSTLO = "Road Signs and Traffic Lights",
    RUFO = "Roads and Urban Furnishings",
    PGAPO = "Public Green Areas and Playgrounds",
}

// @ts-ignore
export enum ReportStatus {
    PENDING = "Pending",
    ASSIGNED = "Assigned",
    IN_PROGRESS = "In Progress",
    SUSPENDED = "Suspended",
    REJECTED = "Rejected",
    RESOLVED = "Resolved",
}

export interface Report {
    id: number;
    citizen?: Citizen;
    timestamp: string;
    status: ReportStatus;
    title: string;
    description: string;
    category: OfficeCategory;
    latitude: number;
    longitude: number;
    photo1: string;
    photo2?: string;
    photo3?: string;
    anonymous: boolean;
    comment?: string;
}

export interface NewReport {
    title: string;
    description: string;
    category: OfficeCategory;
    latitude: number;
    longitude: number;
    anonymous: boolean;
    photos: File[];
}
