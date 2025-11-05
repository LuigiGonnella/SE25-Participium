const BACKEND_URL = "http://localhost:8080";

interface Credentials {
    username: string;
    password: string;
}

interface NewCitizen {
    name: string;
    surname: string;
    username: string;
    email: string;
    receive_emails: boolean;
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

const login = async (credentials: Credentials): Promise<Citizen> => {
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

const register = async (newCitizen: NewCitizen): Promise<Citizen> => {
    const formData = new FormData();
    formData.append('name', newCitizen.name);
    formData.append('surname', newCitizen.surname);
    formData.append('username', newCitizen.username);
    formData.append('email', newCitizen.email);
    formData.append('receive_emails', String(newCitizen.receive_emails));
    formData.append('password', newCitizen.password);

    const response = await fetch(`${BACKEND_URL}/api/registration`, {
        method: 'POST',
        credentials: 'include',
        body: formData,
    });

    if (response.ok) {
        const citizen = await response.json();
        return citizen;
    } else {
        throw new Error('Registration failed');
    }
};

const getUserInfo = async (): Promise<Citizen> => {
    const response = await fetch(`${BACKEND_URL}/api/user`, {
        credentials: 'include',
});
    const user = await response.json();
    if (response.ok) {
        return user as Citizen;
    } else {
        throw new Error('Failed to fetch user info');
    }
};

const logout = async (): Promise<null> => {
    const response = await fetch(`${BACKEND_URL}/api/logout`, {
        method: 'DELETE',
        credentials: 'include',
    });
    if (response.ok) {
        return null;
    } else {
        throw new Error('Logout failed');
    }
};

const API = { login, register, getUserInfo, logout };
export default API;