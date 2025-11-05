import type { Citizen, Credentials } from "../models/Models.ts";

const BACKEND_URL = "http://localhost:8080";

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

const API = { login, getUserInfo, logout };
export default API;