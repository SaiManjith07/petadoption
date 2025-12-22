import { ReactNode } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/lib/auth';
import { FullPageSkeleton } from '@/components/ui/skeletons';

interface UserProtectedRouteProps {
  children: ReactNode;
}

export function UserProtectedRoute({ children }: UserProtectedRouteProps) {
  const { isAuthenticated, isAdmin, loading } = useAuth();
  const location = useLocation();

  // Show loading state while checking auth
  if (loading) {
    return <FullPageSkeleton />;
  }

  // If user is not authenticated, redirect to login
  if (!isAuthenticated) {
    return <Navigate to="/auth/login" replace />;
  }

  // Allow admins to access chat routes (for verification and monitoring)
  const isChatRoute = location.pathname.startsWith('/chat/') || 
                      location.pathname.startsWith('/chats/') || 
                      location.pathname === '/chats' ||
                      location.pathname === '/chat';
  if (isAdmin && isChatRoute) {
    return <>{children}</>;
  }

  // If user is admin but not on chat route, redirect to admin dashboard
  if (isAdmin) {
    return <Navigate to="/admin" replace />;
  }

  return <>{children}</>;
}

