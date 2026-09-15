import DashboardPage from '../pages/dashboard/DashboardPage';
import HrPage from '../pages/hr/HrPage';
import WeighingPage from '../pages/weighing/WeighingPage';
import AccountingPage from '../pages/accounting/AccountingPage';
import ShipmentsPage from '../pages/shipments/ShipmentsPage';
import InventoryPage from '../pages/inventory/InventoryPage';
import CustomersPage from '../pages/customers/CustomersPage';
import AdminUsersPage from '../pages/admin/AdminUsersPage';

// المصدر الوحيد لتعريف الوحدات — تستخدمه القائمة الجانبية والراوتر معًا
// Single source of truth for modules — consumed by both the sidebar and the router.
export const navConfig = [
  {
    key: 'dashboard',
    path: '/dashboard',
    labelKey: 'nav.dashboard',
    allowedRoles: ['admin', 'hr'],
    Component: DashboardPage,
  },
  {
    key: 'hr',
    path: '/hr',
    labelKey: 'nav.hr',
    allowedRoles: ['admin', 'hr'],
    Component: HrPage,
  },
  {
    key: 'weighing',
    path: '/weighing',
    labelKey: 'nav.weighing',
    allowedRoles: ['admin', 'hr'],
    Component: WeighingPage,
  },
  {
    key: 'accounting',
    path: '/accounting',
    labelKey: 'nav.accounting',
    allowedRoles: ['admin', 'hr'],
    Component: AccountingPage,
  },
  {
    key: 'shipments',
    path: '/shipments',
    labelKey: 'nav.shipments',
    allowedRoles: ['admin', 'hr'],
    Component: ShipmentsPage,
  },
  {
    key: 'inventory',
    path: '/inventory',
    labelKey: 'nav.inventory',
    allowedRoles: ['admin', 'hr'],
    Component: InventoryPage,
  },
  {
    key: 'customers',
    path: '/customers',
    labelKey: 'nav.customers',
    allowedRoles: ['admin', 'hr'],
    Component: CustomersPage,
  },
  {
    key: 'admin',
    path: '/admin/users',
    labelKey: 'nav.admin',
    allowedRoles: ['admin'],
    Component: AdminUsersPage,
  },
];
