import { Navigate, Outlet } from 'react-router-dom';
import { authService } from '../../services/auth.service';

interface AuthGuardProps {
  children?: React.ReactNode;
  redirectTo?: string;
}

export default function AuthGuard({
  children,
  redirectTo = '/auth',
}: AuthGuardProps) {
  if (!authService.isAuthenticated()) {
    return <Navigate to={redirectTo} replace />;
  }

  return children ? <>{children}</> : <Outlet />;
}
