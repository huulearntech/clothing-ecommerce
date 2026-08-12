import { Outlet } from 'react-router-dom';
import AdminLayout from '../../layouts/admin.layout';

export default function AdminDashboardRoot() {
  return (
    <AdminLayout>
      <Outlet />
    </AdminLayout>
  );
}
