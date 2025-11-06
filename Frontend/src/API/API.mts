import type {Citizen, Credentials, NewCitizen} from "../models/Models.ts";
import {handleAPIError} from "../services/ErrorHandler.ts";

const BACKEND_URL = "http://localhost:8080/api/v1";

const register = async (newCitizen: NewCitizen): Promise<Citizen> => {
    if (!newCitizen.email || !newCitizen.password || !newCitizen.username) {
        return handleAPIError(
            new Response(null, { status: 400 }), 
            'Registration: Missing required fields'
        );
    }

    const response = await fetch(`${BACKEND_URL}/auth/register`, {
        method: 'POST',
        headers: { "Content-Type": "application/json" },
        credentials: 'include',
        body: JSON.stringify(newCitizen),
    });

    if (response.ok) {
        return await response.json();
    }
    return handleAPIError(response, 'Registration');
};

const login = async (credentials: Credentials, type: 'CITIZEN' | 'STAFF'): Promise<Citizen> => {
    const response = await fetch(`${BACKEND_URL}/auth/login?type=${type}`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify(credentials),
    });
    if(response.ok) {
        return await response.json();
    } 
    return handleAPIError(response, 'Login');
};

const getUserInfo = async (): Promise<Citizen> => {
    const response = await fetch(`${BACKEND_URL}/auth/me`, {
        credentials: 'include',
});
    const user = await response.json();
    if (response.ok) {
        return user as Citizen;
    } 
    return handleAPIError(response, 'Get user info');
};

const logout = async (): Promise<null> => {
    const response = await fetch(`${BACKEND_URL}/auth/logout`, {
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