import { useAuth } from '@/lib/auth';
import { Navigate } from 'react-router-dom';
import { ReactNode } from 'react';

interface AdminRedirectProps {
  children: ReactNode;
  adminPath: string;
}

export const AdminRedirect = ({ children, adminPath }: AdminRedirectProps) => {
  const { isAdmin } = useAuth();

  if (isAdmin) {
    return <Navigate to={adminPath} replace />;
  }

  return <>{children}</>;
};

