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
    officeId: number;
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
    officeId: number;
}

export const StaffRole = {
    ADMIN: "Admin",
    MPRO: "Municipal Public Relations Officer",
    MA: "Municipal Administrator",
    TOSM: "Technical Office Staff Member"
}