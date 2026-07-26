import React, { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate, Outlet } from 'react-router-dom';
import { getCurrentUser, UserSession } from './services/auth';
import Sidebar from './components/Layout/Sidebar';
import TopBar from './components/Layout/TopBar';
import LoginPage from './pages/LoginPage';
import ChatPage from './pages/ChatPage';
import AnalyticsPage from './pages/AnalyticsPage';
import NetworkPage from './pages/NetworkPage';
import ProfilesPage from './pages/ProfilesPage';
import FinancialPage from './pages/FinancialPage';
import ForecastPage from './pages/ForecastPage';
import DecisionSupportPage from './pages/DecisionSupportPage';

// Protected layout component
const MainLayout = ({ user }: { user: UserSession | null }) => {
  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return (
    <div className="flex h-screen w-screen bg-[#F4F5FB] overflow-hidden font-sans selection:bg-purple-500 selection:text-white">
      {/* Ambient Light Accent Glows */}
      <div className="fixed top-0 right-1/4 w-[600px] h-[600px] bg-purple-200/40 rounded-full blur-[140px] pointer-events-none" />
      <div className="fixed bottom-0 left-1/4 w-[600px] h-[600px] bg-indigo-200/30 rounded-full blur-[140px] pointer-events-none" />
      
      <Sidebar user={user} />
      <div className="flex-1 flex flex-col min-w-0 h-full overflow-hidden z-10">
        <TopBar user={user} />
        <main className="flex-1 overflow-y-auto p-6 md:p-8 relative">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

function App() {
  const [user, setUser] = useState<UserSession | null>(getCurrentUser());

  // Listen to localstorage and custom auth events
  useEffect(() => {
    const handleAuthChange = () => {
      setUser(getCurrentUser());
    };
    window.addEventListener('storage', handleAuthChange);
    window.addEventListener('auth-change', handleAuthChange);
    return () => {
      window.removeEventListener('storage', handleAuthChange);
      window.removeEventListener('auth-change', handleAuthChange);
    };
  }, []);

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        
        {/* Protected Dashboard Routes */}
        <Route element={<MainLayout user={user} />}>
          <Route path="/" element={<ChatPage />} />
          <Route path="/analytics" element={<AnalyticsPage />} />
          <Route path="/network" element={<NetworkPage />} />
          <Route path="/profiles" element={<ProfilesPage />} />
          <Route path="/financials" element={<FinancialPage />} />
          <Route path="/forecast" element={<ForecastPage />} />
          <Route path="/decision-support" element={<DecisionSupportPage />} />
        </Route>

        {/* Fallback */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
