import { Routes, Route, Navigate } from 'react-router';
import { useEffect, useState } from 'react';
import API from './API/API.mts';
import './App.css'
import HomePage from './components/Home';
import { LoginForm } from './components/LoginPage';
import DefaultLayout from './components/DefaultLayout';
import 'bootstrap-italia/dist/css/bootstrap-italia.min.css';
import 'typeface-titillium-web';
import 'typeface-roboto-mono';
import 'typeface-lora';

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
       const user = await API.login(credentials);
       setLoggedIn(true);
       setUser(user);
       return { username: user.username }; 
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
        <Route path="/login" index element={
          loggedIn ? 
          <Navigate replace to="/" /> :
          <LoginForm handleLogin={handleLogin} /> 
        } />
      </Route>
    </Routes>
  )
}

export default App
