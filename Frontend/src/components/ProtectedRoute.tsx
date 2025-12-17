import { ReactNode } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/lib/auth';

interface ProtectedRouteProps {
  children: ReactNode;
  requireAuth?: boolean;
  requireAdmin?: boolean;
  redirectTo?: string;
}

export function ProtectedRoute({ 
  children, 
  requireAuth = true, 
  requireAdmin = false,
  redirectTo 
}: ProtectedRouteProps) {
  const { isAuthenticated, isAdmin, loading } = useAuth();
  const location = useLocation();

  // Show loading state while checking auth
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="inline-block h-12 w-12 border-4 border-gray-200 border-t-green-500 rounded-full animate-spin"></div>
          <p className="mt-4 text-lg text-gray-700">Loading...</p>
        </div>
      </div>
    );
  }

  // If authentication is required but user is not authenticated
  if (requireAuth && !isAuthenticated) {
    return <Navigate to="/auth/login" state={{ from: location }} replace />;
  }

  // If admin is required but user is not admin
  if (requireAdmin && !isAdmin) {
    return <Navigate to={redirectTo || "/home"} replace />;
  }

  // If user is admin but trying to access user-only pages
  if (!requireAdmin && isAdmin && location.pathname.startsWith('/home')) {
    return <Navigate to="/admin" replace />;
  }

  // If user is not admin but trying to access admin pages
  if (location.pathname.startsWith('/admin') && !isAdmin) {
    return <Navigate to="/home" replace />;
  }

  return <>{children}</>;
}

