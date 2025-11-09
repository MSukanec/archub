import { useState, useEffect } from 'react';
import { Building2, FileText, Users, MapPin, Globe } from 'lucide-react';

import { AvatarUploader } from '@/components/ui-custom/AvatarUploader';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { PhoneField } from '@/components/ui-custom/fields/PhoneField';

import { useCurrentUser } from '@/hooks/use-current-user';
import { useNavigationStore } from '@/stores/navigationStore';

import { useDebouncedAutoSave } from '@/components/save';
import { useQuery, useMutation } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { queryClient } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import { getOrganizationInitials } from '@/utils/initials';

export function DataBasicTab() {
  const { data: userData } = useCurrentUser();
  const { setSidebarContext } = useNavigationStore();
  const { toast } = useToast();

  // Set sidebar context on mount
  useEffect(() => {
    setSidebarContext('organization');
  }, [setSidebarContext]);
  
  const organizationId = userData?.organization?.id;

  // Get organization data
  const { data: organizationData } = useQuery({
    queryKey: ['organization-data', organizationId],
    queryFn: async () => {
      if (!organizationId || !supabase) return null;
      
      const { data, error } = await supabase
        .from('organization_data')
        .select('*')
        .eq('organization_id', organizationId)
        .single();
        
      if (error && error.code !== 'PGRST116') { // PGRST116 = no rows found
        console.error('Error fetching organization data:', error);
        throw error;
      }
      
      return data;
    },
    enabled: !!organizationId && !!supabase
  });

  // Get actual organization info
  const { data: organizationInfo } = useQuery({
    queryKey: ['organization-info', organizationId],
    queryFn: async () => {
      if (!organizationId || !supabase) return null;
      
      const { data, error } = await supabase
        .from('organizations')
        .select('*')
        .eq('id', organizationId)
        .single();
        
      if (error) {
        console.error('Error fetching organization info:', error);
        throw error;
      }
      
      return data;
    },
    enabled: !!organizationId && !!supabase
  });

  // Form states based on actual database structure
  const [organizationName, setOrganizationName] = useState('');
  const [logoUrl, setLogoUrl] = useState('');
  const [description, setDescription] = useState('');
  const [address, setAddress] = useState('');
  const [city, setCity] = useState('');
  const [state, setState] = useState('');
  const [country, setCountry] = useState('');
  const [postalCode, setPostalCode] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [website, setWebsite] = useState('');
  const [taxId, setTaxId] = useState('');
  const [isInitialized, setIsInitialized] = useState(false);

  // Auto-save mutation for organization data
  const saveOrganizationMutation = useMutation({
    mutationFn: async (dataToSave: any) => {
      if (!organizationId || !supabase) return;

      // Update organization name and logo in organizations table
      if (dataToSave.name !== undefined || dataToSave.logo_url !== undefined) {
        const orgFields = {
          name: dataToSave.name,
          logo_url: dataToSave.logo_url,
        };

        // Remove undefined values
        const cleanOrgData = Object.fromEntries(
          Object.entries(orgFields).filter(([_, value]) => value !== undefined)
        );

        if (Object.keys(cleanOrgData).length > 0) {
          const { error: orgError } = await supabase
            .from('organizations')
            .update(cleanOrgData)
            .eq('id', organizationId);

          if (orgError) throw orgError;
        }
      }

      // Update organization data in organization_data table
      const organizationDataFields = {
        description: dataToSave.description,
        address: dataToSave.address,
        city: dataToSave.city,
        state: dataToSave.state,
        country: dataToSave.country,
        postal_code: dataToSave.postal_code,
        phone: dataToSave.phone,
        email: dataToSave.email,
        website: dataToSave.website,
        tax_id: dataToSave.tax_id,
      };

      // Remove undefined values
      const cleanData = Object.fromEntries(
        Object.entries(organizationDataFields).filter(([_, value]) => value !== undefined)
      );

      if (Object.keys(cleanData).length > 0) {
        // Check if organization_data exists
        const { data: existingData } = await supabase
          .from('organization_data')
          .select('id')
          .eq('organization_id', organizationId)
          .single();

        if (existingData) {
          // Update existing record
          const { error } = await supabase
            .from('organization_data')
            .update(cleanData)
            .eq('organization_id', organizationId);

          if (error) throw error;
        } else {
          // Insert new record
          const { error } = await supabase
            .from('organization_data')
            .insert({
              organization_id: organizationId,
              ...cleanData
            });

          if (error) throw error;
        }
      }
    }
  });

  // Auto-save hook with proper configuration - only enabled after initialization
  const { isSaving } = useDebouncedAutoSave({
    data: {
      name: organizationName,
      logo_url: logoUrl,
      description,
      address,
      city,
      state,
      country,
      postal_code: postalCode,
      phone,
      email,
      website,
      tax_id: taxId
    },
    saveFn: async (data) => {
      await saveOrganizationMutation.mutateAsync(data);
      
      // Show success toast
      toast({
        title: "Datos guardados",
        description: "Los cambios se han guardado automáticamente",
      });
      
      // Invalidate queries to refresh data
      queryClient.invalidateQueries({ queryKey: ['organization-data', organizationId] });
      queryClient.invalidateQueries({ queryKey: ['organization-info', organizationId] });
      queryClient.invalidateQueries({ queryKey: ['current-user'] });
    },
    delay: 750,
    enabled: !!organizationId && isInitialized
  });

  // Initialize form data when data is loaded
  useEffect(() => {
    if (organizationInfo) {
      setOrganizationName(organizationInfo.name || '');
      setLogoUrl(organizationInfo.logo_url || '');
    }
  }, [organizationInfo]);

  useEffect(() => {
    if (organizationData) {
      setDescription(organizationData.description || '');
      setAddress(organizationData.address || '');
      setCity(organizationData.city || '');
      setState(organizationData.state || '');
      setCountry(organizationData.country || '');
      setPostalCode(organizationData.postal_code || '');
      setPhone(organizationData.phone || '');
      setEmail(organizationData.email || '');
      setWebsite(organizationData.website || '');
      setTaxId(organizationData.tax_id || '');
    }
  }, [organizationData]);

  // Mark as initialized once both queries have loaded
  useEffect(() => {
    if (organizationInfo !== undefined && organizationData !== undefined) {
      // Add a small delay to ensure all state updates are complete
      const timer = setTimeout(() => {
        setIsInitialized(true);
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [organizationInfo, organizationData]);

  // Handle logo upload success
  const handleLogoUploadSuccess = async (imageUrl: string) => {
    console.log('Logo upload success callback called with URL:', imageUrl);
    
    if (!organizationId || !supabase) {
      console.error('Missing organizationId or supabase in callback');
      return;
    }

    try {
      // Update organization logo_url in database
      const { error } = await supabase
        .from('organizations')
        .update({ logo_url: imageUrl })
        .eq('id', organizationId);

      if (error) {
        console.error('Error updating logo URL:', error);
        toast({
          title: "Error",
          description: "No se pudo actualizar el logo en la base de datos",
          variant: "destructive"
        });
        return;
      }

      console.log('Logo URL updated successfully in database');

      // Update local state
      setLogoUrl(imageUrl);
      
      // Invalidate queries to refresh data
      queryClient.invalidateQueries({ queryKey: ['organization-info', organizationId] });
      queryClient.invalidateQueries({ queryKey: ['current-user'] });
      
      toast({
        title: "Logo actualizado",
        description: "El logo de la organización se ha actualizado correctamente",
      });
      
    } catch (error) {
      console.error('Unexpected error in logo upload callback:', error);
    }
  };


  return (
    <div className="space-y-6">
        {/* Logo Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Left Column - Logo Description */}
          <div>
            <div className="flex items-center gap-2 mb-6">
              <Building2 className="h-5 w-5 text-[var(--accent)]" />
              <h2 className="text-lg font-semibold">Logo de la Organización</h2>
            </div>
            <p className="text-sm text-muted-foreground">
              Sube el logo oficial de tu organización. Este logo se mostrará en documentos, reportes y comunicaciones oficiales.
            </p>
          </div>

          {/* Right Column - Logo Upload */}
          <div>
            <AvatarUploader
              currentImageUrl={logoUrl}
              fallbackText={getOrganizationInitials(organizationName || organizationInfo?.name || '')}
              bucketName="organization-logo"
              uploadPath={`org-${organizationId}/logo.jpg`}
              onUploadSuccess={handleLogoUploadSuccess}
              title="Logo de la organización"
              description="Imagen que representa tu organización"
              maxSizeMB={5}
            />
          </div>
        </div>

        <hr className="border-t border-[var(--section-divider)] my-8" />

        {/* Two Column Layout - Section descriptions left, content right */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Left Column - Información Básica */}
          <div>
            <div className="flex items-center gap-2 mb-6">
              <FileText className="h-5 w-5 text-[var(--accent)]" />
              <h2 className="text-lg font-semibold">Información Básica</h2>
            </div>
            <p className="text-sm text-muted-foreground">
              Datos fundamentales de la organización que se usarán en todo el sistema. Estos campos son la base para proyectos, documentos y comunicaciones.
            </p>
          </div>

          {/* Right Column - Información Básica Content */}
          <div>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="organization-name">Nombre de la Organización</Label>
                <Input 
                  id="organization-name"
                  placeholder="Ej: Constructora López SA"
                  value={organizationName}
                  onChange={(e) => setOrganizationName(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Descripción</Label>
                <Textarea 
                  id="description"
                  placeholder="Descripción de la organización..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={3}
                />
              </div>
            </div>
          </div>
        </div>

        <hr className="border-t border-[var(--section-divider)] my-8" />

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Left Column - Información de Contacto */}
          <div>
            <div className="flex items-center gap-2 mb-6">
              <Users className="h-5 w-5 text-[var(--accent)]" />
              <h2 className="text-lg font-semibold">Información de Contacto</h2>
            </div>
            <p className="text-sm text-muted-foreground">
              Datos de contacto de la organización. Esta información estará disponible para todo el equipo y se usará en comunicaciones oficiales.
            </p>
          </div>

          {/* Right Column - Información de Contacto Content */}
          <div>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="phone">Teléfono</Label>
                <PhoneField 
                  value={phone}
                  onChange={setPhone}
                  placeholder="Número de teléfono"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input 
                  id="email"
                  type="email"
                  placeholder="Ej: contacto@constructora.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="website">Sitio Web</Label>
                <Input 
                  id="website"
                  type="url"
                  placeholder="Ej: https://www.constructora.com"
                  value={website}
                  onChange={(e) => setWebsite(e.target.value)}
                />
              </div>
            </div>
          </div>
        </div>

        <hr className="border-t border-[var(--section-divider)] my-8" />

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Left Column - Ubicación */}
          <div>
            <div className="flex items-center gap-2 mb-6">
              <MapPin className="h-5 w-5 text-[var(--accent)]" />
              <h2 className="text-lg font-semibold">Ubicación de la Organización</h2>
            </div>
            <p className="text-sm text-muted-foreground">
              Dirección completa de la sede principal. Esta información se usa para documentación oficial, entregas y comunicaciones.
            </p>
          </div>

          {/* Right Column - Ubicación Content */}
          <div>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="address">Dirección</Label>
                <Input 
                  id="address"
                  placeholder="Ej: Av. Corrientes 1234"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="city">Ciudad</Label>
                <Input 
                  id="city"
                  placeholder="Ej: Buenos Aires"
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="state">Provincia/Estado</Label>
                <Input 
                  id="state"
                  placeholder="Ej: Buenos Aires"
                  value={state}
                  onChange={(e) => setState(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="country">País</Label>
                <Input 
                  id="country"
                  placeholder="Ej: Argentina"
                  value={country}
                  onChange={(e) => setCountry(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="postal-code">Código Postal</Label>
                <Input 
                  id="postal-code"
                  placeholder="Ej: C1043AAX"
                  value={postalCode}
                  onChange={(e) => setPostalCode(e.target.value)}
                />
              </div>
            </div>
          </div>
        </div>

        <hr className="border-t border-[var(--section-divider)] my-8" />

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Left Column - Información Legal */}
          <div>
            <div className="flex items-center gap-2 mb-6">
              <Globe className="h-5 w-5 text-[var(--accent)]" />
              <h2 className="text-lg font-semibold">Información Legal</h2>
            </div>
            <p className="text-sm text-muted-foreground">
              Datos fiscales y legales de la organización. Esta información se usa en facturación, contratos y documentación oficial.
            </p>
          </div>

          {/* Right Column - Información Legal Content */}
          <div>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="tax-id">CUIT/CUIL/ID Fiscal</Label>
                <Input 
                  id="tax-id"
                  placeholder="Ej: 20-12345678-9"
                  value={taxId}
                  onChange={(e) => setTaxId(e.target.value)}
                />
              </div>
            </div>
          </div>
        </div>

      </div>
  );
}