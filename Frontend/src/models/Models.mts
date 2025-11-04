export class Citizen{
    id: number;
    email: string;
    username: string;
    name: string;
    surname: string;
    profilePicture: string;
    telegram_username: string;
    receive_emails: boolean;
    constructor(id: number, email: string, username: string, name: string, surname: string, profilePicture: string, telegram_username: string, receive_emails: boolean){
        this.id = id;
        this.email = email;
        this.username = username;
        this.name = name;
        this.surname = surname;
        this.profilePicture = profilePicture;
        this.telegram_username = telegram_username;
        this.receive_emails = receive_emails;
    }
}

export class Staff{
    id: number;
    email: string;
    username: string;
    name: string;
    surname: string;
    password: string;
    constructor(id: number, email: string, username: string, name: string, surname: string, password: string){
        this.id = id;
        this.email = email;
        this.username = username;
        this.name = name;
        this.surname = surname;
        this.password = password;
    }
}