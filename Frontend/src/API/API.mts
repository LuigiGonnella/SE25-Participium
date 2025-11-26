import type {
    Citizen,
    Staff,
    Credentials,
    NewCitizen,
    NewStaff,
    Office,
    User,
    NewReport,
    Report,
    Notification,
    Message
} from "../models/Models.ts";
import {handleAPIError} from "../services/ErrorHandler.ts";

export const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || "http://localhost:8080/api/v1";
export const STATIC_URL = import.meta.env.VITE_STATIC_URL || "http://localhost:8080";

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

const municipalityRegister = async (newStaff: NewStaff): Promise<Staff> => {

    if( !newStaff.username || !newStaff.password || !newStaff.role /*|| !newStaff.officeId*/ ) {
        return handleAPIError(
            new Response(null, { status: 400 }), 
            'Municipality Registration: Missing required fields'
        );
    }

    const response = await fetch(`${BACKEND_URL}/auth/register-municipality`, {
        method: 'POST',
        headers: { "Content-Type": "application/json" },
        credentials: 'include',
        body: JSON.stringify(newStaff),
    });

    if (response.ok) {
        return await response.json();
    }

    return handleAPIError(response, 'Municipality Registration');
}

const login = async (credentials: Credentials, type: 'CITIZEN' | 'STAFF'): Promise<User> => {
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

const getUserInfo = async (): Promise<User> => {
    const response = await fetch(`${BACKEND_URL}/auth/me`, {
        credentials: 'include',
});
    if (response.ok) {
        return await response.json();
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

const getOffices = async (): Promise<Office[]> => {
    const response = await fetch(`${BACKEND_URL}/offices`, {
        method: 'GET',
        credentials: 'include',
    });
    if (response.ok) {
        return await response.json();
    }
    return handleAPIError(response, 'Get Offices');
};

const createReport = async (newReport: NewReport): Promise<Report> => {
    if (!newReport.title || !newReport.description || !newReport.category ||
        newReport.latitude === undefined || newReport.longitude === undefined) {
        return handleAPIError(
            new Response(null, { status: 400 }),
            'Create Report: Missing required fields'
        );
    }

    if (!newReport.photos || newReport.photos.length === 0) {
        return handleAPIError(
            new Response(null, { status: 400 }),
            'Create Report: At least one photo is required'
        );
    }

    if (newReport.photos.length > 3) {
        return handleAPIError(
            new Response(null, { status: 400 }),
            'Create Report: Maximum 3 photos allowed'
        );
    }

    const formData = new FormData();
    formData.append('title', newReport.title);
    formData.append('description', newReport.description);
    formData.append('category', newReport.category);
    formData.append('latitude', newReport.latitude.toString());
    formData.append('longitude', newReport.longitude.toString());
    formData.append('anonymous', newReport.anonymous.toString());

    newReport.photos.forEach((photo) => {
        formData.append('photos', photo);
    });

    const response = await fetch(`${BACKEND_URL}/reports`, {
        method: 'POST',
        credentials: 'include',
        body: formData,
    });

    if (response.ok) {
        return await response.json();
    }
    return handleAPIError(response, 'Create Report');
};
const getReports = async (filters?: Record<string, string>): Promise<Report[]> => {
    const query = filters
        ? "?" + new URLSearchParams(filters).toString()
        : "";

    const response = await fetch(`${BACKEND_URL}/reports${query}`, {
        credentials: "include",
    });

    if (response.ok) return await response.json();
    return handleAPIError(response, "Get Reports");
};

const getMapReports = async (): Promise<Report[]> => {
    const response = await fetch(`${BACKEND_URL}/reports/public`, {
        credentials: "include",
    });

    if (response.ok) return await response.json();
    return handleAPIError(response, "Get Map Reports");
}

const getReportById = async (id: number): Promise<Report> => {
    const response = await fetch(`${BACKEND_URL}/reports/${id}`, {
        credentials: "include",
    });

    if (response.ok) return await response.json();
    return handleAPIError(response, "Get Report Details");
};

const updateReport = async (
    id: number,
    data: any,
    role: string
): Promise<Report> => {
    const endpoint =
        role === "Municipal Public Relations Officer"
            ? `/reports/${id}/manage`
            : `/reports/${id}/work`;

    const response = await fetch(`${BACKEND_URL}${endpoint}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(data),
    });

    if (response.ok) return await response.json();
    return handleAPIError(response, "Update Report");
};

const assignReportToSelf = async (reportId: number): Promise<Report> => {
    const response = await fetch(`${BACKEND_URL}/reports/${reportId}/work`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ status: "IN_PROGRESS" }),
    });

    if (response.ok) return await response.json();
    return handleAPIError(response, "Assign Report");
};

const getNotifications = async (): Promise<Notification[]> => {
    const response = await fetch(`${BACKEND_URL}/notifications`, {
        credentials: "include",
    });

    if (response.ok) return await response.json();
    return handleAPIError(response, "Get Notifications");
}

const markNotificationAsRead = async (notificationId: number): Promise<null> => {
    const response = await fetch(`${BACKEND_URL}/notifications/${notificationId}/read`, {
        method: "PATCH",
        credentials: "include",
    });

    if (response.ok) return null;
    return handleAPIError(response, "Mark Notification as Read");
}

const createMessage = async (reportId: number, message: string): Promise<Report> => {
    const response = await fetch(`${BACKEND_URL}/reports/${reportId}/messages`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ message }),
    });
    if (response.ok) return await response.json();
    return handleAPIError(response, "Create Message");
};

const getAllMessages = async (reportId: number): Promise<Message[]> => {
    const response = await fetch(`${BACKEND_URL}/reports/${reportId}/messages`, {
        credentials: "include",
    });
    if (response.ok) return await response.json();
    return handleAPIError(response, "Get All Messages");
}

const updateCitizenProfile = async (
    username: string,
    updates: {
        telegram_username?: string;
        receive_emails?: boolean;
        profilePicture?: File;
    }
): Promise<Citizen> => {
    const formData = new FormData();
    
    if (updates.telegram_username !== undefined) {
        formData.append('telegram_username', updates.telegram_username);
    }
    if (updates.receive_emails !== undefined) {
        formData.append('receive_emails', updates.receive_emails.toString());
    }
    if (updates.profilePicture) {
        formData.append('profilePicture', updates.profilePicture);
    }

    const response = await fetch(`${BACKEND_URL}/citizens/${username}`, {
        method: 'PATCH',
        credentials: 'include',
        body: formData,
    });

    if (response.ok) return await response.json();
    return handleAPIError(response, 'Update Citizen Profile');
};

const API = { login, register, getUserInfo, logout, municipalityRegister, getOffices, createReport, getReports, getMapReports, getReportById, updateReport, assignReportToSelf, getNotifications, markNotificationAsRead, createMessage, getAllMessages, updateCitizenProfile };
export default API;