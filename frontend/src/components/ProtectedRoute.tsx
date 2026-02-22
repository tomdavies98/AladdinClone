import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

export default function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { token, isReady } = useAuth();
  const location = useLocation();

  if (!isReady) return (
    <div className="loading" role="status" aria-live="polite">
      <span className="loading-spinner" aria-hidden="true" />
      <span>Loading…</span>
    </div>
  );
  if (!token) return <Navigate to="/" state={{ from: location }} replace />;
  return <>{children}</>;
}
