import { Routes, Route, Navigate } from 'react-router';
import { useEffect, useState } from 'react';
import API from './API/API.mts';
import './App.css'
import HomePage from './components/Home';
import { LoginForm } from './components/LoginPage';
import DefaultLayout from './components/DefaultLayout';
import RegistrationForm from './components/RegistrationPage';
import 'bootstrap-italia/dist/css/bootstrap-italia.min.css';
import 'typeface-titillium-web/index.css';
import 'typeface-roboto-mono/index.css';
import 'typeface-lora/index.css';
import type {Citizen, NewCitizen} from "./models/Models.ts";

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

  const handleLogin = async (credentials: Credentials): Promise<{ username: string }> => {
    try {
       const user = await API.login(credentials, 'CITIZEN');
       setLoggedIn(true);
       setUser(user);
       return { username: user.username }; 
    } catch (err) {
        throw err;
    }
  };

  const handleRegistration = async (newCitizen: NewCitizen): Promise<Citizen> => {
    try {
       const user = await API.register(newCitizen);
       setLoggedIn(true);
       setUser(user);
       return user;
    } catch (err) {
        throw err;
    }
  };

  const handleLogout = async (): Promise<void> => {
    await API.logout();
    setLoggedIn(false);
    setUser({});
    window.location.href = '/';
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
        <Route path="/registration" element={<RegistrationForm handleRegistration={handleRegistration} />} />
      </Route>
    </Routes>
  )
}

export default App
