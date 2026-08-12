import { createBrowserRouter, RouterProvider } from 'react-router-dom';

import CartPage from './pages/cart';
import Home from './pages/home';
import ProductDetailPage from './pages/product_detail';
import ProductsPage from './pages/products';

import WishlistPage from './pages/wishlist';
import CheckoutPage from './pages/checkout';
import AccountPage from './pages/account';
import OrdersPage from './pages/orders';
import AuthPage from './pages/auth';
import AdminDashboardRoot from './pages/admin/admin-root';
import AdminOverviewPage from './pages/admin/overview-page';
import AdminProductsPage from './pages/admin/products-page';
import AdminOrdersPage from './pages/admin/orders-page';
import AdminVouchersPage from './pages/admin/vouchers-page';
import AuthGuard from './components/guards/auth-guard';
import GuestGuard from './components/guards/guest-guard';
import CustomerGuard from './components/guards/customer-guard';


import { Toaster } from './components/ui/sonner';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'

const queryClient = new QueryClient()


const router = createBrowserRouter([
  {
    path: '/',
    element: <Home />,
    errorElement: <div>404</div>
  },
  {
    path: '/auth',
    element: (
      <GuestGuard>
        <AuthPage />
      </GuestGuard>
    ),
  },
  {
    path: '/cart',
    element: (
      <CustomerGuard>
        <CartPage />
      </CustomerGuard>
    ),
  },
  {
    path: '/products',
    element: <ProductsPage />,
  },
  {
    path: '/products/:id',
    element: <ProductDetailPage />,
  },
  {
    path: '/wishlist',
    element: (
      <AuthGuard>
        <CustomerGuard>
          <WishlistPage />
        </CustomerGuard>
      </AuthGuard>
    ),
  },
  {
    path: '/checkout',
    element: (
      <CustomerGuard>
        <CheckoutPage />
      </CustomerGuard>
    ),
  },
  {
    path: '/orders',
    element: (
      <AuthGuard>
        <CustomerGuard>
          <OrdersPage />
        </CustomerGuard>
      </AuthGuard>
    ),
  },
  {
    path: '/account',
    element: (
      <AuthGuard>
        <AccountPage />
      </AuthGuard>
    ),
  },
  // Admin Sub-routes
  {
    path: '/admin',
    element: (
      <AuthGuard>
        <AdminDashboardRoot />
      </AuthGuard>
    ),
    children: [
      {
        index: true,
        element: <AdminOverviewPage />,
      },
      {
        path: 'products',
        element: <AdminProductsPage />,
      },
      {
        path: 'orders',
        element: <AdminOrdersPage />,
      },
      {
        path: 'vouchers',
        element: <AdminVouchersPage />,
      },
    ],
  },
]);

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <RouterProvider router={router} />
      <Toaster position="bottom-right" richColors />
    </QueryClientProvider>
  );
}

export default App;
