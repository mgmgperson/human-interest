import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import NavBar from './components/layout/NavBar';
import AccountsPage from './pages/AccountsPage';
import AccountDetailPage from './pages/AccountDetailPage';
import SimulatorPage from './pages/SimulatorPage';

/** Root component: router, global layout shell, page routes. */
export default function App() {
  return (
    <BrowserRouter>
      <div className="min-h-screen bg-slate-50">
        <NavBar />
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <Routes>
            <Route path="/" element={<Navigate to="/accounts" replace />} />
            <Route path="/accounts" element={<AccountsPage />} />
            <Route path="/accounts/:id" element={<AccountDetailPage />} />
            <Route path="/simulator" element={<SimulatorPage />} />
          </Routes>
        </main>
      </div>
    </BrowserRouter>
  );
}
