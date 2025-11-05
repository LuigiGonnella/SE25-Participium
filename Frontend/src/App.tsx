import { Routes, Route } from 'react-router';
import './App.css'
import HomePage from './components/Home';
import LoginForm from './components/LoginPage';
import DefaultLayout from './components/DefaultLayout';
import TurinMaskedMap from './components/Map';

function App() {
  return (
    <Routes>
      <Route element={<DefaultLayout />}>
        <Route path="/home" index element={<HomePage />} />
        <Route path="/login" index element={<LoginForm />} />
        <Route path="/map" index element={<TurinMaskedMap />} />
      </Route>
    </Routes>
  )
}

export default App
