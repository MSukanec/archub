import React, { useState } from 'react';
import { Crown } from 'lucide-react';
import { Layout } from '@/components/layout/desktop/Layout';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import AdminCommunityDashboard from './tabs/AdminCommunityDashboard';
import AdminCommunityOrganizations from './tabs/AdminCommunityOrganizations';
import AdminCommunityUsers from './tabs/AdminCommunityUsers';

const AdminCommunity = () => {
  const [activeTab, setActiveTab] = useState('resumen');

  return (
    <Layout
      icon={Crown}
      title="Comunidad"
      description="Gestión de la comunidad y organizaciones"
    >
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="resumen">Resumen</TabsTrigger>
          <TabsTrigger value="organizaciones">Organizaciones</TabsTrigger>
          <TabsTrigger value="usuarios">Usuarios</TabsTrigger>
        </TabsList>

        <TabsContent value="resumen">
          <AdminCommunityDashboard />
        </TabsContent>

        <TabsContent value="organizaciones">
          <AdminCommunityOrganizations />
        </TabsContent>

        <TabsContent value="usuarios">
          <AdminCommunityUsers />
        </TabsContent>
      </Tabs>
    </Layout>
  );
};

export default AdminCommunity;