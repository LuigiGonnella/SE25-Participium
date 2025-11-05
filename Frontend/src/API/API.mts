import type { Citizen, Credentials } from "../models/Models.ts";
import { handleAPIError } from "../services/ErrorHandler.ts";

const BACKEND_URL = "http://localhost:8080";

const register = async (newCitizen: Citizen): Promise<Citizen> => {
    if (!newCitizen.email || !newCitizen.password || !newCitizen.username) {
        return handleAPIError(
            new Response(null, { status: 400 }), 
            'Registration: Missing required fields'
        );
    }

    const formData = new FormData();
    formData.append('email', newCitizen.email);
    formData.append('username', newCitizen.username);
    formData.append('name', newCitizen.name);
    formData.append('surname', newCitizen.surname);
    formData.append('password', newCitizen.password);
    formData.append('receive_emails', String(newCitizen.receive_emails));

    if (newCitizen.profilePicture) {
        formData.append('profilePicture', newCitizen.profilePicture);
    }

    if (newCitizen.telegram_username) {
        formData.append('telegram_username', newCitizen.telegram_username);
    }

    const response = await fetch(`${BACKEND_URL}/api/register`, {
        method: 'POST',
        credentials: 'include',
        body: formData,
    });

    if (response.ok) {
        const citizen = await response.json();
        return citizen;
    }
    return handleAPIError(response, 'Registration');
};

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
    } 
    return handleAPIError(response, 'Login');
};

const getUserInfo = async (): Promise<Citizen> => {
    const response = await fetch(`${BACKEND_URL}/api/user`, {
        credentials: 'include',
});
    const user = await response.json();
    if (response.ok) {
        return user as Citizen;
    } 
    return handleAPIError(response, 'Get user info');
};

const logout = async (): Promise<null> => {
    const response = await fetch(`${BACKEND_URL}/api/logout`, {
        method: 'DELETE',
        credentials: 'include',
    });
    if (response.ok) {
        return null;
    } 
    return handleAPIError(response, 'Logout');
};

const API = { login, register, getUserInfo, logout };
export default API;