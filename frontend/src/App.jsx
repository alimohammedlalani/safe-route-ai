import { BrowserRouter, Routes, Route } from 'react-router-dom'
import Navbar from './components/Navbar'

import Dashboard from './pages/Dashboard'
import Trends from './pages/Trends'


export default function App() {
  return (
    <BrowserRouter>
      <div className="min-h-screen flex flex-col" style={{ background: 'var(--bg-primary)' }}>
        <Navbar />
        <Routes>
          <Route path="/"    element={<Dashboard />} />
          <Route path="/dashboard"    element={<Dashboard />} />
          <Route path="/trends"       element={<Trends />} />
        </Routes>
      </div>
    </BrowserRouter>
  )
}
