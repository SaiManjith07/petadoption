import { ReactNode } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '@/lib/auth';

interface UserProtectedRouteProps {
  children: ReactNode;
}

export function UserProtectedRoute({ children }: UserProtectedRouteProps) {
  const { isAuthenticated, isAdmin, loading } = useAuth();

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

  // If user is admin, redirect to admin dashboard
  if (isAdmin) {
    return <Navigate to="/admin" replace />;
  }

  return <>{children}</>;
}

