import { useState, useEffect } from 'react';
import { useMutation, useQuery } from '@tanstack/react-query';
import { Coins, Package2, Plus, Settings, CheckCircle, XCircle, Filter, Search } from 'lucide-react';

import { Layout } from '@/components/layout/desktop/Layout';
import { ActionBarDesktop } from '@/components/layout/desktop/ActionBarDesktop';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ComboBoxMultiRows } from '@/components/ui-custom/ComboBoxMultiRows';
import { HelpPopover } from '@/components/ui-custom/HelpPopover';
import { FeatureIntroduction } from '@/components/ui-custom/FeatureIntroduction';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { DraggableConceptTree, MovementConceptNode } from '@/components/ui-custom/DraggableConceptTree';

import { useCurrentUser } from '@/hooks/use-current-user';
import { useCurrencies, useOrganizationCurrencies } from '@/hooks/use-currencies';
import { useAllWallets } from '@/hooks/use-wallets';
import { useOrganizationWallets } from '@/hooks/use-organization-wallets';
import { useNavigationStore } from '@/stores/navigationStore';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/lib/supabase';
import { queryClient } from '@/lib/queryClient';
import { useOrganizationMovementConcepts, MovementConceptOrganization } from '@/hooks/use-organization-movement-concepts';
import { useDeleteMovementConcept, useMoveConceptToParent } from '@/hooks/use-movement-concepts-admin';
import { useGlobalModalStore } from '@/components/modal/form/useGlobalModalStore';
import { useDeleteConfirmation } from '@/hooks/use-delete-confirmation';

export default function OrganizationPreferences() {
  const { data: userData } = useCurrentUser();
  const { setSidebarContext } = useNavigationStore();
  const { data: allCurrencies } = useCurrencies();
  const { data: organizationCurrencies } = useOrganizationCurrencies(userData?.organization?.id);
  const { data: allWallets } = useAllWallets();
  const { data: organizationWallets } = useOrganizationWallets(userData?.organization?.id);
  const { toast } = useToast();

  // Form states
  const [defaultCurrency, setDefaultCurrency] = useState<string>('');
  const [secondaryCurrencies, setSecondaryCurrencies] = useState<string[]>([]);
  const [defaultWallet, setDefaultWallet] = useState<string>('');
  const [secondaryWallets, setSecondaryWallets] = useState<string[]>([]);

  // Movement concepts states
  const [searchTerm, setSearchTerm] = useState('');
  const [expandedConcepts, setExpandedConcepts] = useState<Set<string>>(new Set());
  const [systemFilter, setSystemFilter] = useState<'all' | 'system' | 'user'>('all');

  // Global modal store
  const { openModal } = useGlobalModalStore();
  const { showDeleteConfirmation } = useDeleteConfirmation();

  // Movement concepts hooks
  const { data: concepts = [], isLoading: conceptsLoading } = useOrganizationMovementConcepts(userData?.organization?.id);
  const deleteConceptMutation = useDeleteMovementConcept();
  const moveConceptMutation = useMoveConceptToParent();

  // Set sidebar context on mount
  useEffect(() => {
    setSidebarContext('organization');
  }, [setSidebarContext]);

  // Initialize form values from organization data
  useEffect(() => {
    if (organizationCurrencies?.length) {
      const defaultCur = organizationCurrencies.find(c => c.is_default);
      const secondaryCurs = organizationCurrencies.filter(c => !c.is_default);
      
      if (defaultCur) {
        setDefaultCurrency(defaultCur.currency_id);
      }
      setSecondaryCurrencies(secondaryCurs.map(c => c.currency_id));
    }
  }, [organizationCurrencies]);

  useEffect(() => {
    if (organizationWallets?.length) {
      const defaultWal = organizationWallets.find(w => w.is_default);
      const secondaryWals = organizationWallets.filter(w => !w.is_default);
      
      if (defaultWal) {
        setDefaultWallet(defaultWal.wallet_id);
      }
      setSecondaryWallets(secondaryWals.map(w => w.wallet_id));
    }
  }, [organizationWallets]);

  // Save default currency mutation
  const saveDefaultCurrencyMutation = useMutation({
    mutationFn: async (currencyId: string) => {
      if (!userData?.organization?.id || !supabase) throw new Error('No organization found');

      // First, remove default from all currencies
      await supabase
        .from('organization_currencies')
        .update({ is_default: false })
        .eq('organization_id', userData.organization.id);

      // Then set the new default
      const { error } = await supabase
        .from('organization_currencies')
        .update({ is_default: true })
        .eq('organization_id', userData.organization.id)
        .eq('currency_id', currencyId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['organization-currencies'] });
      toast({ title: "Moneda por defecto actualizada", description: "Los cambios se han guardado correctamente." });
    },
  });

  // Save default wallet mutation
  const saveDefaultWalletMutation = useMutation({
    mutationFn: async (walletId: string) => {
      if (!userData?.organization?.id || !supabase) throw new Error('No organization found');

      // First, remove default from all wallets
      await supabase
        .from('organization_wallets')
        .update({ is_default: false })
        .eq('organization_id', userData.organization.id);

      // Then set the new default
      const { error } = await supabase
        .from('organization_wallets')
        .update({ is_default: true })
        .eq('organization_id', userData.organization.id)
        .eq('wallet_id', walletId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['organization-wallets'] });
      toast({ title: "Billetera por defecto actualizada", description: "Los cambios se han guardado correctamente." });
    },
  });

  // Add/remove secondary currencies
  const updateSecondaryCurrenciesMutation = useMutation({
    mutationFn: async (currencyIds: string[]) => {
      if (!userData?.organization?.id || !supabase) throw new Error('No organization found');

      // Get current organization currencies
      const { data: currentCurrencies } = await supabase
        .from('organization_currencies')
        .select('currency_id')
        .eq('organization_id', userData.organization.id);

      const currentIds = currentCurrencies?.map(c => c.currency_id) || [];
      const allSelectedIds = [defaultCurrency, ...currencyIds].filter(Boolean);

      // Remove currencies that are not selected
      const toRemove = currentIds.filter(id => !allSelectedIds.includes(id));
      if (toRemove.length > 0) {
        await supabase
          .from('organization_currencies')
          .delete()
          .eq('organization_id', userData.organization.id!)
          .in('currency_id', toRemove);
      }

      // Add new currencies
      const toAdd = allSelectedIds.filter(id => !currentIds.includes(id));
      if (toAdd.length > 0) {
        const newRecords = toAdd.map(currencyId => ({
          organization_id: userData.organization?.id!,
          currency_id: currencyId,
          is_active: true,
          is_default: currencyId === defaultCurrency,
        }));

        await supabase
          .from('organization_currencies')
          .insert(newRecords);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['organization-currencies'] });
      toast({ title: "Monedas secundarias actualizadas", description: "Los cambios se han guardado correctamente." });
    },
  });

  // Add/remove secondary wallets
  const updateSecondaryWalletsMutation = useMutation({
    mutationFn: async (walletIds: string[]) => {
      if (!userData?.organization?.id || !supabase) throw new Error('No organization found');

      // Get current organization wallets
      const { data: currentWallets } = await supabase
        .from('organization_wallets')
        .select('wallet_id')
        .eq('organization_id', userData.organization.id);

      const currentIds = currentWallets?.map(w => w.wallet_id) || [];
      const allSelectedIds = [defaultWallet, ...walletIds].filter(Boolean);

      // Remove wallets that are not selected
      const toRemove = currentIds.filter(id => !allSelectedIds.includes(id));
      if (toRemove.length > 0) {
        await supabase
          .from('organization_wallets')
          .delete()
          .eq('organization_id', userData.organization.id!)
          .in('wallet_id', toRemove);
      }

      // Add new wallets
      const toAdd = allSelectedIds.filter(id => !currentIds.includes(id));
      if (toAdd.length > 0) {
        const newRecords = toAdd.map(walletId => ({
          organization_id: userData.organization?.id!,
          wallet_id: walletId,
          is_active: true,
          is_default: walletId === defaultWallet,
        }));

        await supabase
          .from('organization_wallets')
          .insert(newRecords);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['organization-wallets'] });
      toast({ title: "Billeteras secundarias actualizadas", description: "Los cambios se han guardado correctamente." });
    },
  });

  const handleDefaultCurrencyChange = (currencyId: string) => {
    setDefaultCurrency(currencyId);
    // Remove from secondary currencies if it was there
    setSecondaryCurrencies(prev => prev.filter(id => id !== currencyId));
    saveDefaultCurrencyMutation.mutate(currencyId);
  };

  const handleDefaultWalletChange = (walletId: string) => {
    setDefaultWallet(walletId);
    // Remove from secondary wallets if it was there
    setSecondaryWallets(prev => prev.filter(id => id !== walletId));
    saveDefaultWalletMutation.mutate(walletId);
  };

  const handleSecondaryCurrenciesChange = (currencyIds: string[]) => {
    setSecondaryCurrencies(currencyIds);
    updateSecondaryCurrenciesMutation.mutate(currencyIds);
  };

  const handleSecondaryWalletsChange = (walletIds: string[]) => {
    setSecondaryWallets(walletIds);
    updateSecondaryWalletsMutation.mutate(walletIds);
  };

  // Get available currencies and wallets (excluding defaults from secondary options)
  const availableSecondaryCurrencies = allCurrencies?.filter(c => c.id !== defaultCurrency) || [];
  const availableSecondaryWallets = allWallets?.filter(w => w.id !== defaultWallet) || [];

  // Movement concepts functions
  const calculateStats = (concepts: MovementConceptOrganization[]) => {
    let totalConcepts = 0;
    let systemConcepts = 0;
    let userConcepts = 0;

    const countRecursive = (concepts: MovementConceptOrganization[]) => {
      concepts.forEach(concept => {
        totalConcepts++;
        
        if (concept.is_system) {
          systemConcepts++;
        } else {
          userConcepts++;
        }
        
        if (concept.children && concept.children.length > 0) {
          countRecursive(concept.children);
        }
      });
    };

    countRecursive(concepts);
    return { 
      totalConcepts, 
      systemConcepts, 
      userConcepts 
    };
  };

  const stats = calculateStats(concepts);

  const handleOpenCreateModal = () => {
    openModal('organization-movement-concept');
  };

  const handleOpenEditModal = (concept: MovementConceptOrganization) => {
    openModal('organization-movement-concept', { editingConcept: concept });
  };

  const handleCreateChildConcept = (parentConcept: MovementConceptNode) => {
    openModal('organization-movement-concept', { 
      parentConcept: {
        id: parentConcept.id,
        name: parentConcept.name,
        parent_id: parentConcept.parent_id,
        is_system: parentConcept.is_system
      }
    });
  };

  const handleDeleteConcept = (conceptId: string) => {
    // Find the concept to get its name
    const findConceptInTree = (concepts: MovementConceptOrganization[], id: string): MovementConceptOrganization | null => {
      for (const concept of concepts) {
        if (concept.id === id) return concept;
        if (concept.children) {
          const found = findConceptInTree(concept.children, id);
          if (found) return found;
        }
      }
      return null;
    };

    const concept = findConceptInTree(concepts, conceptId);
    if (!concept) return;

    // Check if it's a system concept
    if (concept.is_system) {
      toast({
        title: "Eliminación no permitida",
        description: "Los conceptos del sistema no pueden ser eliminados",
        variant: "destructive"
      });
      return;
    }

    showDeleteConfirmation({
      title: "Eliminar Concepto",
      description: `¿Estás seguro de que deseas eliminar el concepto "${concept.name}"? Esta acción no se puede deshacer.`,
      itemName: concept.name,
      mode: 'dangerous',
      onConfirm: async () => {
        try {
          await deleteConceptMutation.mutateAsync(conceptId);
        } catch (error) {
          console.error('Error deleting concept:', error);
        }
      }
    });
  };

  const handleMoveToParent = async (conceptId: string, newParentId: string | null) => {
    try {
      await moveConceptMutation.mutateAsync({ conceptId, newParentId });
    } catch (error) {
      console.error('Error moving concept:', error);
    }
  };

  return (
    <Layout 
      showSidebar 
      wide={false}
      headerProps={{
        title: "Preferencias",
        breadcrumb: [
          { name: "Organización", href: "/organization/dashboard" },
          { name: "Preferencias", href: "/organization/preferences" }
        ]
      }}
    >
      <div className="space-y-8">
        {/* ActionBar - Desktop Only */}
        <ActionBarDesktop 
          title="Preferencias de la Organización"
          icon={<Settings className="h-5 w-5" />}
          showProjectSelector={false}
          showSearch={false}
          showGrouping={false}
          features={[
            {
              icon: <Coins className="h-4 w-4" />,
              title: "Monedas Predeterminadas", 
              description: "Configurar monedas predeterminadas y secundarias para movimientos financieros"
            },
            {
              icon: <Coins className="h-4 w-4" />,
              title: "Billeteras por Defecto",
              description: "Establecer billeteras por defecto para optimizar la gestión de flujo de caja"
            },
            {
              icon: <Package2 className="h-4 w-4" />,
              title: "Conceptos de Finanzas", 
              description: "Administrar los conceptos disponibles para categorizar movimientos financieros"
            },
            {
              icon: <Settings className="h-4 w-4" />,
              title: "Preferencias Globales",
              description: "Administrar las preferencias globales que afectan a todos los proyectos"
            }
          ]}
        />

        {/* FeatureIntroduction - Mobile Only */}
        <FeatureIntroduction
          icon={<Coins className="h-5 w-5" />}
          title="Preferencias de la Organización"
          features={[
            {
              icon: <Coins className="h-4 w-4" />,
              title: "Monedas Predeterminadas",
              description: "Configurar monedas predeterminadas y secundarias para movimientos financieros"
            },
            {
              icon: <Coins className="h-4 w-4" />,
              title: "Billeteras por Defecto",
              description: "Establecer billeteras por defecto para optimizar la gestión de flujo de caja"
            },
            {
              icon: <Package2 className="h-4 w-4" />,
              title: "Conceptos de Finanzas",
              description: "Administrar los conceptos disponibles para categorizar movimientos financieros"
            },
            {
              icon: <Settings className="h-4 w-4" />,
              title: "Preferencias Globales",
              description: "Administrar las preferencias globales que afectan a todos los proyectos"
            }
          ]}
        />

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
          {/* Left Column - Titles and Descriptions */}
          <div className="space-y-12">
            {/* Monedas y Billeteras Section */}
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Coins className="h-5 w-5 text-[var(--accent)]" />
                <h2 className="text-lg font-semibold">Monedas y Billeteras</h2>
                <HelpPopover 
                  title="Monedas y Billeteras"
                  description="Estas configuraciones determinan qué monedas y billeteras tendrás disponibles al crear movimientos financieros. Tu selección por defecto se usará automáticamente en nuevos movimientos, mientras que las secundarias aparecerán como opciones adicionales."
                />
              </div>
              <p className="text-sm text-muted-foreground">
                Configura las monedas y billeteras que utilizas frecuentemente en tu organización
              </p>
            </div>
          </div>

          {/* Right Column - Form Fields */}
          <div className="space-y-8">
            {/* Monedas y Billeteras */}
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="default-currency">Moneda por Defecto</Label>
                <Select value={defaultCurrency} onValueChange={handleDefaultCurrencyChange}>
                  <SelectTrigger id="default-currency">
                    <SelectValue placeholder="Selecciona una moneda" />
                  </SelectTrigger>
                  <SelectContent>
                    {allCurrencies?.map((currency) => (
                      <SelectItem key={currency.id} value={currency.id}>
                        {currency.name} ({currency.symbol})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="secondary-currencies">Monedas Secundarias</Label>
                <ComboBoxMultiRows
                  options={availableSecondaryCurrencies.map(currency => ({
                    value: currency.id,
                    label: `${currency.name} (${currency.symbol})`
                  }))}
                  value={secondaryCurrencies}
                  onChange={handleSecondaryCurrenciesChange}
                  placeholder="Selecciona una moneda secundaria"
                  addButtonText="Agregar Moneda Secundaria"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="default-wallet">Billetera por Defecto</Label>
                <Select value={defaultWallet} onValueChange={handleDefaultWalletChange}>
                  <SelectTrigger id="default-wallet">
                    <SelectValue placeholder="Selecciona una billetera" />
                  </SelectTrigger>
                  <SelectContent>
                    {allWallets?.map((wallet) => (
                      <SelectItem key={wallet.id} value={wallet.id}>
                        {wallet.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="secondary-wallets">Billeteras Secundarias</Label>
                <ComboBoxMultiRows
                  options={availableSecondaryWallets.map(wallet => ({
                    value: wallet.id,
                    label: wallet.name
                  }))}
                  value={secondaryWallets}
                  onChange={handleSecondaryWalletsChange}
                  placeholder="Selecciona una billetera secundaria"
                  addButtonText="Agregar Billetera Secundaria"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Section Divider */}
        {/* <div className="border-t border-[var(--section-divider)] my-8" /> */}

        {/* Conceptos de Finanzas Section - TEMPORARILY HIDDEN */}
        {/* <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
          {/* Left Column - Description */}
          {/* <div className="space-y-4">
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Package2 className="h-5 w-5 text-[var(--accent)]" />
                <h2 className="text-lg font-semibold">Conceptos de Finanzas</h2>
                <HelpPopover 
                  title="Conceptos de Finanzas"
                  description="Administra los conceptos disponibles para categorizar tus movimientos financieros. Los conceptos del sistema son predeterminados, mientras que puedes crear conceptos personalizados para tu organización."
                />
              </div>
              <p className="text-sm text-muted-foreground">
                Gestiona los conceptos disponibles para categorizar movimientos financieros. Los conceptos del sistema no pueden ser modificados, pero puedes crear conceptos personalizados para tu organización.
              </p>
            </div>
          </div> */}

          {/* Right Column - Concepts Tree */}
          {/* <div className="space-y-4">
            {conceptsLoading ? (
              <div className="flex items-center justify-center py-8">
                <div className="text-sm text-muted-foreground">Cargando conceptos...</div>
              </div>
            ) : concepts.length === 0 ? (
              <div className="flex items-center justify-center py-8">
                <div className="text-sm text-muted-foreground">No hay conceptos disponibles</div>
              </div>
            ) : (
              <DraggableConceptTree
                concepts={concepts}
                expandedConcepts={expandedConcepts}
                onToggleExpanded={(conceptId: string) => {
                  setExpandedConcepts(prev => {
                    const newSet = new Set(prev);
                    if (newSet.has(conceptId)) {
                      newSet.delete(conceptId);
                    } else {
                      newSet.add(conceptId);
                    }
                    return newSet;
                  });
                }}
                onEdit={handleOpenEditModal}
                onDelete={handleDeleteConcept}
                onCreateChild={handleCreateChildConcept}
                onMove={handleMoveToParent}
              />
            )}
          </div>
        </div> */}
      </div>
    </Layout>
  );
}