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
}

export interface Staff {
    id: number;
    email: string;
    username: string;
    name: string;
    surname: string;
    password: string;
}

export interface Credentials {
    username: string;
    password: string;
}