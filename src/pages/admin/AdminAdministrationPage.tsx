import React, { useState } from 'react';
import { Settings, Plus, Calendar, ChevronDown } from 'lucide-react';
import { Layout } from "@/layouts/dashboard/DashboardLayout";
import { useGlobalModalStore } from '@/components/modal';
import AdminDashboardView from '@/features/admin/views/AdminDashboardView';
import AdminOrganizationsView from '@/features/admin/views/AdminOrganizationsView';
import AdminUsersView from '@/features/admin/views/AdminUsersView';
import AdminActivityLogsView from '@/features/admin/views/AdminActivityLogsView';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";

type PeriodFilter = '30d' | '3m' | '6m' | '1y' | 'all'

const PERIOD_OPTIONS: { value: PeriodFilter; label: string }[] = [
  { value: '30d', label: 'Últimos 30 días' },
  { value: '3m', label: 'Últimos 3 meses' },
  { value: '6m', label: 'Últimos 6 meses' },
  { value: '1y', label: 'Último año' },
  { value: 'all', label: 'Histórico' },
]

const AdminAdministrationPage = () => {
  const [activeTab, setActiveTab] = useState('vision-general');
  const [selectedPeriod, setSelectedPeriod] = useState<PeriodFilter>('all');
  const [periodPopoverOpen, setPeriodPopoverOpen] = useState(false);
  const { openModal } = useGlobalModalStore();

  const tabs = [
    { id: 'vision-general', label: 'Visión General', isActive: activeTab === 'vision-general' },
    { id: 'organizaciones', label: 'Organizaciones', isActive: activeTab === 'organizaciones' },
    { id: 'usuarios', label: 'Usuarios', isActive: activeTab === 'usuarios' },
    { id: 'actividad', label: 'Actividad', isActive: activeTab === 'actividad' }
  ];

  const periodContent = (
    <Popover open={periodPopoverOpen} onOpenChange={setPeriodPopoverOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className="gap-2"
          data-testid="select-period"
        >
          <Calendar className="h-4 w-4" />
          <span>{PERIOD_OPTIONS.find(opt => opt.value === selectedPeriod)?.label || 'Período'}</span>
          <ChevronDown className="h-4 w-4" />
        </Button>
      </PopoverTrigger>
      <PopoverContent align="end" className="min-w-[180px] p-2">
        <div className="flex flex-col gap-1">
          {PERIOD_OPTIONS.map((option) => (
            <button
              key={option.value}
              onClick={() => {
                setSelectedPeriod(option.value);
                setPeriodPopoverOpen(false);
              }}
              className={`flex items-center gap-2 px-3 py-2 text-sm rounded-md transition-colors text-left w-full ${
                selectedPeriod === option.value 
                  ? "font-medium bg-accent/10" 
                  : "hover:bg-accent/5"
              }`}
              data-testid={`option-period-${option.value}`}
            >
              <span>{option.label}</span>
            </button>
          ))}
        </div>
      </PopoverContent>
    </Popover>
  );

  const getActionButton = () => {
    switch (activeTab) {
      case 'organizaciones':
        return {
          label: "Nueva Organización",
          icon: Plus,
          onClick: () => openModal('admin-organization', { isEditing: false })
        };
      case 'usuarios':
        return {
          label: "Nuevo Usuario",
          icon: Plus,
          onClick: () => openModal('admin-user', { isEditing: false })
        };
      default:
        return undefined;
    }
  };

  const headerProps = {
    title: "Administración",
    description: "Gestiona usuarios, organizaciones y actividad del sistema.",
    icon: Settings,
    showSearch: false,
    showFilters: false,
    tabs,
    onTabChange: setActiveTab,
    actions: activeTab === 'vision-general' ? [periodContent] : [],
    actionButton: getActionButton()
  };

  const renderTabContent = () => {
    switch (activeTab) {
      case 'vision-general':
        return <AdminDashboardView selectedPeriod={selectedPeriod} />;
      case 'organizaciones':
        return <AdminOrganizationsView />;
      case 'usuarios':
        return <AdminUsersView />;
      case 'actividad':
        return <AdminActivityLogsView />;
      default:
        return <AdminDashboardView selectedPeriod={selectedPeriod} />;
    }
  };

  return (
    <Layout wide={false} headerProps={headerProps}>
      {renderTabContent()}
    </Layout>
  );
};

export default AdminAdministrationPage;
