import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { PreferencesProvider } from './contexts/PreferencesContext';
import ProtectedRoute from './components/ProtectedRoute';
import Layout from './components/Layout';
import Landing from './pages/Landing';
import Login from './pages/Login';
import Signup from './pages/Signup';
import Dashboard from './pages/Dashboard';
import Portfolio from './pages/Portfolio';
import Risk from './pages/Risk';
import Trading from './pages/Trading';
import Operations from './pages/Operations';
import PrivateMarkets from './pages/PrivateMarkets';
import DataAnalytics from './pages/DataAnalytics';
import EsgClimate from './pages/EsgClimate';
import Wealth from './pages/Wealth';
import Ecosystem from './pages/Ecosystem';
import DesignPrinciples from './pages/DesignPrinciples';
import './App.css';

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Landing />} />
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Signup />} />
          <Route
            path="/app"
            element={
              <ProtectedRoute>
                <PreferencesProvider>
                  <Layout />
                </PreferencesProvider>
              </ProtectedRoute>
            }
          >
            <Route index element={<Dashboard />} />
            <Route path="portfolio" element={<Portfolio />} />
            <Route path="risk" element={<Risk />} />
            <Route path="trading" element={<Trading />} />
            <Route path="operations" element={<Operations />} />
            <Route path="private-markets" element={<PrivateMarkets />} />
            <Route path="data-analytics" element={<DataAnalytics />} />
            <Route path="esg-climate" element={<EsgClimate />} />
            <Route path="wealth" element={<Wealth />} />
            <Route path="ecosystem" element={<Ecosystem />} />
            <Route path="design-principles" element={<DesignPrinciples />} />
          </Route>
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
