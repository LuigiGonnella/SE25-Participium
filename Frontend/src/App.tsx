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
        if (isCitizen(user) && !user.email) {
            return <Navigate replace to="/verify-email"/>;
        }
        return <Navigate replace to={isCitizen(user) ? "/map" : "/reports"}/>;
    };

    const getMapContent = () => {
        if (!user?.email) {
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

    const toggleRefresh = () => setRefresh(prev => !prev);

    return (
        <Routes>
            <Route element={<DefaultLayout loggedIn={loggedIn} user={user} handleLogout={handleLogout} loading={!authChecked}/>}>
                <Route path="" element={!loggedIn || isCitizen(user) ? <HomePage/> : <Navigate replace to="/reports"/>}/>
                <Route path="login" element={
                    loggedIn ? getLoginRedirect() : <LoginForm handleLogin={handleLogin}/>
                }/>
                <Route path="registration" element={
                    loggedIn ?
                        <Navigate replace to="/"/> :
                        <RegistrationForm handleRegistration={handleRegistration}/>
                }/>
                <Route path="verify-email" element={
                    (isCitizen(user) && !user.email || !loggedIn) ?
                        <EmailVerificationPage refresh={toggleRefresh} /> :
                        <Navigate replace to="/"/>
                }/>
                <Route path="municipality-registration" element={
                    (loggedIn && isStaff(user) && user.role === StaffRole.ADMIN) ?
                        <MunicipalityRegistrationForm handleStaffRegistration={handleMunicipalityRegistration}/> :
                        <Navigate replace to="/"/>
                }/>
                <Route path="/map" element={
                    loggedIn && isCitizen(user) ? getMapContent() : <Navigate replace to="/"/>
                }/>
                <Route path="/reports" element={
                    loggedIn && (isMPRO(user) || isTOSM(user) || isEM(user)) ?
                        <ReportListPage user={user}/> :
                        <Navigate replace to={(isStaff(user) && user.role === StaffRole.ADMIN) ? "/municipality-registration" : "/login"}/>
                }/>
                <Route path="/reports/:id" element={
                    loggedIn && (isMPRO(user) || isTOSM(user) || isEM(user)) ?
                        <ReportDetailPage user={user} /> :
                        <Navigate replace to="/login"/>
                }/>
                <Route path="/profile" element={
                    loggedIn && user ? getProfileContent() : <Navigate replace to="/login"/>
                }/>
                <Route path="/tosms" element={
                    loggedIn && isStaff(user) && user.role === StaffRole.ADMIN ? 
                        <AdminTOSMPage />
                    : <Navigate replace to="/"/>
                }/>
                <Route path="*" element={<Navigate replace to="/"/>}/>
            </Route>
        </Routes>
    )
}

export default App
