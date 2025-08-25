import React, { useState } from 'react';
import { Package } from 'lucide-react';
import { Layout } from '@/components/layout/desktop/Layout';
import ProductList from './ProductList';

const Products = () => {
  const [activeTab, setActiveTab] = useState('productos');

  const tabs = [
    { id: 'productos', label: 'Productos', isActive: activeTab === 'productos' }
  ];

  const headerProps = {
    title: "Productos",
    icon: Package,
    showSearch: false,
    showFilters: false,
    tabs,
    onTabChange: setActiveTab,
    actionButton: undefined // No action button for now as requested
  };

  const renderTabContent = () => {
    switch (activeTab) {
      case 'productos':
        return <ProductList />;
      default:
        return <ProductList />;
    }
  };

  return (
    <Layout wide headerProps={headerProps}>
      {renderTabContent()}
    </Layout>
  );
};

export default Products;