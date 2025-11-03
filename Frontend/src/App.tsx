import { useState } from 'react'
import { Routes, Route, Navigate } from 'react-router';
import './App.css'
import HomePage from './components/Home';

function App() {
  const [count, setCount] = useState(0)

  return (
    <Routes>
      <Route path="/" element={<HomePage />} />
    </Routes>
  )
}

export default App
