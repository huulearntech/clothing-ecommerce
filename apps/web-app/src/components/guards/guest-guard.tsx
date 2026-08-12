import { Navigate, Outlet } from 'react-router-dom';
import { authService } from '../../services/auth.service';

interface GuestGuardProps {
  children?: React.ReactNode;
  redirectTo?: string;
}

export default function GuestGuard({
  children,
  redirectTo = '/account',
}: GuestGuardProps) {
  if (authService.isAuthenticated()) {
    return <Navigate to={redirectTo} replace />;
  }

  return children ? <>{children}</> : <Outlet />;
}
