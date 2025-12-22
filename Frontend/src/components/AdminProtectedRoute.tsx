import { ReactNode } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '@/lib/auth';
import { FullPageSkeleton } from '@/components/ui/skeletons';

interface AdminProtectedRouteProps {
  children: ReactNode;
}

export function AdminProtectedRoute({ children }: AdminProtectedRouteProps) {
  const { isAdmin, loading } = useAuth();

  // Show loading state while checking auth
  if (loading) {
    return <FullPageSkeleton />;
  }

  // If user is not admin, redirect to home
  if (!isAdmin) {
    return <Navigate to="/home" replace />;
  }

  return <>{children}</>;
}

