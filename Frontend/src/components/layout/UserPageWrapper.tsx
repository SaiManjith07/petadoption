import { ReactNode } from 'react';
import { useLocation } from 'react-router-dom';
import { useAuth } from '@/lib/auth';
import { UserLayout } from './UserLayout';

interface UserPageWrapperProps {
  children: ReactNode;
}

export function UserPageWrapper({ children }: UserPageWrapperProps) {
  const { isAuthenticated } = useAuth();
  const location = useLocation();
  const isAdminPage = location.pathname.startsWith('/admin');
  const isPublicPage = location.pathname === '/' || 
    location.pathname.startsWith('/auth') || 
    location.pathname === '/policy' || 
    location.pathname === '/safety';

  // Use UserLayout for authenticated users on non-admin, non-public pages
  if (isAuthenticated && !isAdminPage && !isPublicPage) {
    return <UserLayout>{children}</UserLayout>;
  }

  return <>{children}</>;
}

