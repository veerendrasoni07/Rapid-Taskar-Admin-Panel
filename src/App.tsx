import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useAuthStore } from './store/authStore';
import Layout from './components/layout/Layout';

// Pages
import Dashboard from './pages/Dashboard';
import Customers from './pages/Customers';
import Professionals from './pages/Professionals';
import Services from './pages/Services';
import Categories from './pages/Categories';
import Pricing from './pages/Pricing';
import Bookings from './pages/Bookings';
import Payments from './pages/Payments';
import Reviews from './pages/Reviews';
import Complaints from './pages/Complaints';
import Reports from './pages/Reports';
import Login from './pages/Login';
import { useEffect } from 'react';

const queryClient = new QueryClient();

// Auth Guard Component
function RequireAuth({ children }: { children: React.ReactNode }) {
  const token = useAuthStore(state => state.token);
  const location = useLocation();

  if (!token) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return children;
}

function App() {
  const logout = useAuthStore(state => state.logout);
  
  useEffect(() => {
    const handleUnauthorized = () => {
      logout();
    };
    window.addEventListener('auth:unauthorized', handleUnauthorized);
    return () => window.removeEventListener('auth:unauthorized', handleUnauthorized);
  }, [logout]);

  return (
    <QueryClientProvider client={queryClient}>
      <Router>
        <Routes>
          <Route path="/login" element={<Login />} />
          
          <Route path="/" element={
            <RequireAuth>
              <Layout><Dashboard /></Layout>
            </RequireAuth>
          } />
          <Route path="/customers" element={<RequireAuth><Layout><Customers /></Layout></RequireAuth>} />
          <Route path="/professionals" element={<RequireAuth><Layout><Professionals /></Layout></RequireAuth>} />
          <Route path="/services" element={<RequireAuth><Layout><Services /></Layout></RequireAuth>} />
          <Route path="/categories" element={<RequireAuth><Layout><Categories /></Layout></RequireAuth>} />
          <Route path="/pricing" element={<RequireAuth><Layout><Pricing /></Layout></RequireAuth>} />
          <Route path="/bookings" element={<RequireAuth><Layout><Bookings /></Layout></RequireAuth>} />
          <Route path="/payments" element={<RequireAuth><Layout><Payments /></Layout></RequireAuth>} />
          <Route path="/reviews" element={<RequireAuth><Layout><Reviews /></Layout></RequireAuth>} />
          <Route path="/complaints" element={<RequireAuth><Layout><Complaints /></Layout></RequireAuth>} />
          <Route path="/reports" element={<RequireAuth><Layout><Reports /></Layout></RequireAuth>} />
        </Routes>
      </Router>
    </QueryClientProvider>
  );
}

export default App;
