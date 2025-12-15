import {Navigate, Route, Routes} from 'react-router';
import {useEffect, useState} from 'react';
import API from './API/API.mts';
import './App.css'
import HomePage from './components/Home';
import {LoginForm} from './components/LoginPage';
import DefaultLayout from './components/DefaultLayout';
import TurinMaskedMap from './components/Map';
import { RegistrationForm, MunicipalityRegistrationForm } from './components/RegistrationPage';
import ReportListPage from "./components/ReportListPage";
import ReportDetailPage from "./components/ReportDetailPage";
import StaffProfile from "./components/StaffProfile";
import CitizenProfile from "./components/CitizenProfile";
import EmailVerificationPage from "./components/EmailVerificationPage";
import 'bootstrap-italia/dist/css/bootstrap-italia.min.css';
import 'bootstrap-icons/font/bootstrap-icons.min.css';
import 'typeface-titillium-web/index.css';
import 'typeface-roboto-mono/index.css';
import 'typeface-lora/index.css';
import {
    type NewCitizen,
    type NewStaff,
    type Credentials,
    type User,
    isStaff, StaffRole,
    isMPRO, isTOSM, isCitizen, isEM
} from "./models/Models.ts";
import AdminTOSMPage from './components/AllTOSM.tsx';

// Helper function to check if user can access reports
const canAccessReports = (user: User | undefined): boolean => {
    return isMPRO(user) || isTOSM(user) || isEM(user);
};

// Helper function to check if user is admin
const isAdmin = (user: User | undefined): boolean => {
    return isStaff(user) && user.role === StaffRole.ADMIN;
};

// Helper function to check if citizen needs email verification
const needsEmailVerification = (user: User | undefined): boolean => {
    return isCitizen(user) && !user.email;
};

function App() {
    const [loggedIn, setLoggedIn] = useState<boolean>(false);
    const [user, setUser] = useState<User>();
    const [authChecked, setAuthChecked] = useState<boolean>(false);
    const [refresh, setRefresh] = useState<boolean>(false);

    useEffect(() => {
        const checkAuth = async (): Promise<void> => {
            try {
                const user = await API.getUserInfo();
                setLoggedIn(true);
                setUser(user);
            } catch (err) {
                console.error(err);
                setLoggedIn(false);
                setUser(undefined);
            } finally {
                setAuthChecked(true);
            }
        };
        checkAuth();
    }, [refresh]);

    const handleLogin = async (credentials: Credentials, type: 'CITIZEN' | 'STAFF') => {
        const user = await API.login(credentials, type);
        setLoggedIn(true);
        setUser(user);
    };

    const handleRegistration = async (newCitizen: NewCitizen): Promise<void> => {
        await API.register(newCitizen);
    };

    const handleMunicipalityRegistration = async (newStaff: NewStaff): Promise<void> => {
        await API.municipalityRegister(newStaff);
    };

    const handleLogout = async (): Promise<void> => {
        await API.logout();
        setLoggedIn(false);
        setUser(undefined);
    };

    const getLoginRedirect = () => {
        if (needsEmailVerification(user)) {
            return <Navigate replace to="/verify-email"/>;
        }
        return <Navigate replace to={isCitizen(user) ? "/map" : "/reports"}/>;
    };

    const getMapContent = () => {
        if (loggedIn && isCitizen(user) && !user?.email) {
            return <Navigate replace to="/verify-email"/>;
        }
        return <TurinMaskedMap isLoggedIn={loggedIn} user={user}/>;
    };

    const getProfileContent = () => {
        if (isStaff(user)) {
            return <StaffProfile user={user} />;
        }
        if (!user?.email) {
            return <Navigate replace to="/verify-email"/>;
        }
        return <CitizenProfile user={user} refresh={toggleRefresh} />;
    };

    const getHomeElement = () => {
        return !loggedIn || isCitizen(user) ? <HomePage/> : <Navigate replace to="/reports"/>;
    };

    const getLoginElement = () => {
        return loggedIn ? getLoginRedirect() : <LoginForm handleLogin={handleLogin}/>;
    };

    const getRegistrationElement = () => {
        return loggedIn ? <Navigate replace to="/"/> : <RegistrationForm handleRegistration={handleRegistration}/>;
    };

    const getVerifyEmailElement = () => {
        return needsEmailVerification(user) || !loggedIn 
            ? <EmailVerificationPage refresh={toggleRefresh} /> 
            : <Navigate replace to="/"/>;
    };

    const getMunicipalityRegistrationElement = () => {
        return loggedIn && isAdmin(user)
            ? <MunicipalityRegistrationForm handleStaffRegistration={handleMunicipalityRegistration}/>
            : <Navigate replace to="/"/>;
    };

    const getMapElement = () => {
        return getMapContent();
    };

    const getReportsElement = () => {
        if (loggedIn && canAccessReports(user) && user) {
            return <ReportListPage user={user}/>;
        }
        return <Navigate replace to={isAdmin(user) ? "/municipality-registration" : "/login"}/>;
    };

    const getReportDetailElement = () => {
        return <ReportDetailPage user={user} />;
    };

    const getProfileElement = () => {
        return loggedIn && user ? getProfileContent() : <Navigate replace to="/login"/>;
    };

    const getTOSMsElement = () => {
        return loggedIn && isAdmin(user) ? <AdminTOSMPage /> : <Navigate replace to="/"/>;
    };

    const toggleRefresh = () => setRefresh(prev => !prev);

    return (
        <Routes>
            <Route element={<DefaultLayout loggedIn={loggedIn} user={user} handleLogout={handleLogout} loading={!authChecked}/>}>
                <Route path="" element={getHomeElement()}/>
                <Route path="login" element={getLoginElement()}/>
                <Route path="registration" element={getRegistrationElement()}/>
                <Route path="verify-email" element={getVerifyEmailElement()}/>
                <Route path="municipality-registration" element={getMunicipalityRegistrationElement()}/>
                <Route path="/map" element={!isStaff(user) ? getMapElement() : <Navigate replace to="/"/>}/>
                <Route path="/reports" element={getReportsElement()}/>
                <Route path="/reports/:id" element={getReportDetailElement()}/>
                <Route path="/profile" element={getProfileElement()}/>
                <Route path="/tosms" element={getTOSMsElement()}/>
                <Route path="*" element={<Navigate replace to="/"/>}/>
            </Route>
        </Routes>
    )
}

export default App
