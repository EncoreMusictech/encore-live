import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useDemoAccess } from '@/hooks/useDemoAccess';
import { logSecurityEvent, isSessionValid } from '@/lib/security';

interface DemoOrProtectedRouteProps {
  children: React.ReactNode;
  moduleId?: string; // Optional module ID for demo access checking
}

const DemoOrProtectedRoute = ({ children, moduleId }: DemoOrProtectedRouteProps) => {
  const { user, session, loading } = useAuth();
  const { isDemo, isAdmin, canAccess } = useDemoAccess();
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

  // Allow admin access
  if (isAdmin) {
    return <>{children}</>;
  }

  // Allow demo access for unauthenticated users
  if (isDemo && !user) {
    // If a specific module is specified, check demo access limits
    if (moduleId && !canAccess(moduleId)) {
      // Demo limit reached, but still allow access to show the upgrade modal
      return <>{children}</>;
    }
    return <>{children}</>;
  }

  // For authenticated users, require valid session
  if (user && session) {
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
  }

  // If not authenticated and not in demo mode, redirect to auth
  if (!user && !isDemo) {
    logSecurityEvent('unauthorized_access_attempt', {
      path: location.pathname,
      timestamp: Date.now()
    });
    return <Navigate to="/auth" state={{ from: location }} replace />;
  }

  return <>{children}</>;
};

export default DemoOrProtectedRoute;