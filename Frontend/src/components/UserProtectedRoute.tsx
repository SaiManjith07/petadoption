import { ReactNode } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/lib/auth';

interface UserProtectedRouteProps {
  children: ReactNode;
}

export function UserProtectedRoute({ children }: UserProtectedRouteProps) {
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

  // If user is not authenticated, redirect to login
  if (!isAuthenticated) {
    return <Navigate to="/auth/login" replace />;
  }

  // Allow admins to access chat routes (for verification and monitoring)
  const isChatRoute = location.pathname.startsWith('/chat/');
  if (isAdmin && !isChatRoute) {
    return <Navigate to="/admin" replace />;
  }

  // If user is admin and accessing chat route, allow it
  if (isAdmin && isChatRoute) {
    return <>{children}</>;
  }

  // If user is admin but not on chat route, redirect to admin dashboard
  if (isAdmin) {
    return <Navigate to="/admin" replace />;
  }

  return <>{children}</>;
}

