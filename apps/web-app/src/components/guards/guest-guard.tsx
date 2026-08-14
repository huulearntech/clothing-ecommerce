import { Navigate, Outlet } from 'react-router-dom';
import { authService } from '../../services/auth.service';

interface GuestGuardProps {
  children?: React.ReactNode;
  redirectTo?: string;
}

export default function GuestGuard({
  children,
}: GuestGuardProps) {
  if (authService.isAuthenticated()) {
    const user = authService.getCurrentUser();
    const target = user?.role?.toUpperCase() === 'ADMIN' ? '/admin' : '/';
    return <Navigate to={target} replace />;
  }

  return children ? <>{children}</> : <Outlet />;
}
