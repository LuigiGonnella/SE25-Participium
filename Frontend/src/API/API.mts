const BACKEND_URL = "http://localhost:8080";

interface Credentials {
    username: string;
    password: string;
}

interface Citizen{
    id: number;
    email: string;
    username: string;
    name: string;
    surname: string;
    profilePicture: string;
    telegram_username: string;
    receive_emails: boolean;
}

export async function login(credentials: Credentials): Promise<Citizen> {
    const response = await fetch(`${BACKEND_URL}/api/login`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify(credentials),
    });
    if(response.ok) {
        const citizen = await response.json();
        return citizen;
    } else {
        throw new Error('Login failed');
    }
};