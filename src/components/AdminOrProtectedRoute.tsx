import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useDemoAccess } from '@/hooks/useDemoAccess';
import { logSecurityEvent, isSessionValid } from '@/lib/security';

interface AdminOrProtectedRouteProps {
  children: React.ReactNode;
}

const ADMIN_EMAILS = ['info@encoremusic.tech', 'support@encoremusic.tech', 'operations@encoremusic.tech'];

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

  // Allow admin access (supports demo access and both admin emails)
  const userEmail = user?.email?.toLowerCase() || '';
  if (ADMIN_EMAILS.includes(userEmail) || isAdmin) {
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

  // Check if session is expired (handle both seconds and ISO string)
  if (session.expires_at) {
    const exp: any = session.expires_at as any;
    const expiresAtMs = typeof exp === 'number'
      ? exp * 1000
      : typeof exp === 'string' && /^\d+$/.test(exp)
        ? parseInt(exp, 10) * 1000
        : new Date(exp).getTime();

    if (!Number.isNaN(expiresAtMs) && Date.now() >= expiresAtMs) {
      logSecurityEvent('expired_session_access', {
        userId: user.id,
        expiresAt: session.expires_at,
        path: location.pathname
      });
      return <Navigate to="/auth" state={{ from: location }} replace />;
    }
  }

  return <>{children}</>;
};

export default AdminOrProtectedRoute;