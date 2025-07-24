import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { logSecurityEvent, isSessionValid } from '@/lib/security';

interface ProtectedRouteProps {
  children: React.ReactNode;
}

const ProtectedRoute = ({ children }: ProtectedRouteProps) => {
  const { user, session, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="mt-2 text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  if (!user || !session) {
    logSecurityEvent('unauthorized_access_attempt', {
      path: location.pathname,
      timestamp: Date.now()
    });
    return <Navigate to="/auth" state={{ from: location }} replace />;
  }

  // Validate session age (sessions older than 24 hours should be refreshed)
  const sessionTimestamp = session.expires_at ? new Date(session.expires_at).getTime() : Date.now();
  if (!isSessionValid(sessionTimestamp, 86400000)) { // 24 hours
    logSecurityEvent('expired_session_access', {
      userId: user.id,
      sessionAge: Date.now() - sessionTimestamp,
      path: location.pathname
    });
    return <Navigate to="/auth" state={{ from: location }} replace />;
  }

  return <>{children}</>;
};

export default ProtectedRoute;