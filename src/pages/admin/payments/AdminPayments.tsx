import { Wallet } from 'lucide-react';
import { Layout } from '@/components/layout/desktop/Layout';
import AdminPaymentsTransfersTab from './AdminPaymentsTransfersTab';

const AdminPayments = () => {
  const headerProps = {
    title: "Pagos",
    icon: Wallet,
    showSearch: false,
    showFilters: false,
  };

  return (
    <Layout wide headerProps={headerProps}>
      <AdminPaymentsTransfersTab />
    </Layout>
  );
};

export default AdminPayments;
