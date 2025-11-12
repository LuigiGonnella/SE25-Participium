import { Routes, Route, Navigate } from 'react-router';
import { useEffect, useState } from 'react';
import API from './API/API.mts';
import './App.css'
import HomePage from './components/Home';
import { LoginForm } from './components/LoginPage';
import DefaultLayout from './components/DefaultLayout';
import { RegistrationForm, MunicipalityRegistrationForm } from './components/RegistrationPage';
import 'bootstrap-italia/dist/css/bootstrap-italia.min.css';
import 'typeface-titillium-web/index.css';
import 'typeface-roboto-mono/index.css';
import 'typeface-lora/index.css';
import type {Citizen, NewCitizen, Staff, NewStaff} from "./models/Models.ts";

interface User {
  username?: string;
  [key: string]: any;
}

interface Credentials {
  username: string;
  password: string;
}

function App() {
  const [loggedIn, setLoggedIn] = useState<boolean>(false);
  const [user, setUser] = useState<User>({});
  
  useEffect(() => {
    const checkAuth = async (): Promise<void> => {
      const user = await API.getUserInfo();
      setLoggedIn(true);
      setUser(user);
    };
    checkAuth();
  }, []);

  const handleLogin = async (credentials: Credentials, type:'CITIZEN'| 'STAFF'): Promise<{ username: string }> => {
    try {
       const user = await API.login(credentials, type);
       setLoggedIn(true);
       setUser(user);
       return { username: user.username }; 
    } catch (err) {
        throw err;
    }
  };

  const handleRegistration = async (newCitizen: NewCitizen): Promise<Citizen> => {
    try {
       return await API.register(newCitizen);
    } catch (err) {
        throw err;
    }
  };

  const handleMunicipalityRegistration = async (newStaff: NewStaff): Promise<Staff> => {
    try {
       return await API.municipalityRegister(newStaff);
    } catch (err) {
        throw err;
    }
  };

  const handleLogout = async (): Promise<void> => {
    await API.logout();
    setLoggedIn(false);
    setUser({});
  };

  return (
    <Routes>
      <Route element={<DefaultLayout loggedIn={loggedIn} user={user} handleLogout={handleLogout} />}>
        <Route path="/" index element={<HomePage />} />
        <Route path="/login" element={
          loggedIn ? 
          <Navigate replace to="/" /> :
          <LoginForm handleLogin={handleLogin} /> 
        } />

        <Route path="/registration" element={
          loggedIn ? 
          <Navigate replace to="/" /> :
          <RegistrationForm handleRegistration={handleRegistration} 
          />} />

        {
          loggedIn && user.type === 'STAFF' && user.role === 'admin' &&
          <Route path="/municipality-registration" element={<MunicipalityRegistrationForm handleStaffRegistration={handleMunicipalityRegistration} />} />
        }
      </Route>
    </Routes>
  )
}

export default App
