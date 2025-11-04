import { Routes, Route } from 'react-router';
import './App.css'
import HomePage from './components/Home';
import LoginForm from './components/LoginPage';
import DefaultLayout from './components/DefaultLayout';

function App() {
  return (
    <Routes>
      <Route element={<DefaultLayout />}>
        <Route path="/home" index element={<HomePage />} />
        <Route path="/login" index element={<LoginForm />} />
      </Route>
    </Routes>
  )
}

export default App
