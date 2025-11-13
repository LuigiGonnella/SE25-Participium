import {Navigate, Route, Routes} from 'react-router';
import {useEffect, useState} from 'react';
import API from './API/API.mts';
import './App.css'
import HomePage from './components/Home';
import {LoginForm} from './components/LoginPage';
import DefaultLayout from './components/DefaultLayout';
import TurinMaskedMap from './components/Map';
import { RegistrationForm, MunicipalityRegistrationForm } from './components/RegistrationPage';
import 'bootstrap-italia/dist/css/bootstrap-italia.min.css';
import 'typeface-titillium-web/index.css';
import 'typeface-roboto-mono/index.css';
import 'typeface-lora/index.css';
import {
    type NewCitizen,
    type NewStaff,
    type Credentials,
    type User,
    isStaff, StaffRole
} from "./models/Models.ts";


function App() {
    const [loggedIn, setLoggedIn] = useState<boolean>(false);
    const [user, setUser] = useState<User>();
    const [authChecked, setAuthChecked] = useState<boolean>(false);

    useEffect(() => {
        const checkAuth = async (): Promise<void> => {
            try {
                const user = await API.getUserInfo();
                setLoggedIn(true);
                setUser(user);
            } catch (err) {
                setLoggedIn(false);
                setUser(undefined);
            } finally {
                setAuthChecked(true);
            }
        };
        checkAuth();
    }, []);

    const handleLogin = async (credentials: Credentials, type: 'CITIZEN' | 'STAFF') => {
        try {
            const user = await API.login(credentials, type);
            setLoggedIn(true);
            setUser(user);
        } catch (err) {
            throw err;
        }
    };

    const handleRegistration = async (newCitizen: NewCitizen): Promise<void> => {
        try {
            await API.register(newCitizen);
        } catch (err) {
            throw err;
        }
    };

    const handleMunicipalityRegistration = async (newStaff: NewStaff): Promise<void> => {
        try {
            await API.municipalityRegister(newStaff);
        } catch (err) {
            throw err;
        }
    };

    const handleLogout = async (): Promise<void> => {
        await API.logout();
        setLoggedIn(false);
        setUser(undefined);
    };

    return (
        <Routes>
            <Route element={<DefaultLayout loggedIn={loggedIn} user={user} handleLogout={handleLogout} loading={!authChecked}/>}>
                <Route path="" element={<HomePage/>}/>
                <Route path="login" element={
                    loggedIn ?
                        <Navigate replace to="/"/> :
                        <LoginForm handleLogin={handleLogin}/>
                }/>

                <Route path="registration" element={
                    loggedIn ?
                        <Navigate replace to="/"/> :
                        <RegistrationForm handleRegistration={handleRegistration}
                        />}/>
                <Route path="municipality-registration"
                       element={(loggedIn && isStaff(user) && user.role === StaffRole.ADMIN) ?
                           <MunicipalityRegistrationForm handleStaffRegistration={handleMunicipalityRegistration}/>
                           : <Navigate replace to="/"/>}/>
                <Route path="/map" element={<TurinMaskedMap />} />
            </Route>
        </Routes>
    )
}

export default App
