import { Routes, Route } from 'react-router';
import './App.css'
import HomePage from './components/Home';
import LoginForm from './components/LoginPage';
import DefaultLayout from './components/DefaultLayout';
import 'bootstrap-italia/dist/css/bootstrap-italia.min.css';
import 'typeface-titillium-web';
import 'typeface-roboto-mono';
import 'typeface-lora';

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
