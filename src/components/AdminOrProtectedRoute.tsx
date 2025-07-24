import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useDemoAccess } from '@/hooks/useDemoAccess';
import { logSecurityEvent, isSessionValid } from '@/lib/security';

interface AdminOrProtectedRouteProps {
  children: React.ReactNode;
}

const ADMIN_EMAIL = 'info@encoremusic.tech';

const AdminOrProtectedRoute = ({ children }: AdminOrProtectedRouteProps) => {
  const { user, session, loading } = useAuth();
  const { isAdmin } = useDemoAccess();
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

  // Allow admin access without authentication
  if (user?.email === ADMIN_EMAIL || isAdmin) {
    return <>{children}</>;
  }

  // For non-admin users, require authentication
  if (!user || !session) {
    logSecurityEvent('unauthorized_access_attempt', {
      path: location.pathname,
      timestamp: Date.now()
    });
    return <Navigate to="/auth" state={{ from: location }} replace />;
  }

  // Validate session age for authenticated non-admin users
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

export default AdminOrProtectedRoute;