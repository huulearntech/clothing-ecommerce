import { Navigate, Outlet } from 'react-router-dom';
import { authService } from '../../services/auth.service';

interface CustomerGuardProps {
  children?: React.ReactNode;
  redirectTo?: string;
}

export default function CustomerGuard({ // NOTE: Be careful
  children,
  redirectTo = '/admin',
}: CustomerGuardProps) {
  const currentUser = authService.getCurrentUser();
  if (currentUser?.role === 'ADMIN') {
    return <Navigate to={redirectTo} replace />;
  }

  return children ? <>{children}</> : <Outlet />;
}
