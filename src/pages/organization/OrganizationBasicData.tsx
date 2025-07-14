import { useState, useEffect, useRef } from 'react';
import { Building2, FileText, Users, MapPin, Globe, Camera, Upload } from 'lucide-react';

import { Layout } from '@/components/layout/desktop/Layout';
import { FeatureIntroduction } from '@/components/ui-custom/FeatureIntroduction';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { PhoneInput } from '@/components/ui-custom/PhoneInput';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

import { useCurrentUser } from '@/hooks/use-current-user';
import { useNavigationStore } from '@/stores/navigationStore';
import { useDebouncedAutoSave } from '@/hooks/useDebouncedAutoSave';
import { useQuery, useMutation } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { queryClient } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';

export default function OrganizationBasicData() {
  const { data: userData } = useCurrentUser();
  const { setSidebarContext } = useNavigationStore();
  const { toast } = useToast();
  
  const organizationId = userData?.preferences?.last_organization_id;

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
  
  // Logo upload states
  const [showLogoUpload, setShowLogoUpload] = useState(false);
  const [isUploadingLogo, setIsUploadingLogo] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

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

  // Auto-save hook with proper configuration
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
    },
    delay: 750,
    enabled: !!organizationId
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

  // Logo upload mutation
  const uploadLogoMutation = useMutation({
    mutationFn: async (file: File) => {
      if (!organizationId || !supabase) throw new Error('No organization or supabase');

      setIsUploadingLogo(true);

      // Upload to Supabase Storage
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('organization-logo')
        .upload(`org-${organizationId}/${file.name}`, file, { upsert: true });

      if (uploadError) throw uploadError;

      // Get public URL
      const { data: urlData } = supabase.storage
        .from('organization-logo')
        .getPublicUrl(`org-${organizationId}/${file.name}`);

      const publicUrl = urlData.publicUrl;

      // Update organization logo_url
      const { error: updateError } = await supabase
        .from('organizations')
        .update({ logo_url: publicUrl })
        .eq('id', organizationId);

      if (updateError) throw updateError;

      return publicUrl;
    },
    onSuccess: (publicUrl) => {
      setLogoUrl(publicUrl);
      setIsUploadingLogo(false);
      setShowLogoUpload(false);
      toast({
        title: "Logo subido",
        description: "El logo de la organización se ha actualizado correctamente",
      });
      
      // Invalidate queries
      queryClient.invalidateQueries({ queryKey: ['organization-info', organizationId] });
    },
    onError: (error) => {
      setIsUploadingLogo(false);
      console.error('Error uploading logo:', error);
      toast({
        title: "Error",
        description: "No se pudo subir el logo. Inténtalo de nuevo.",
        variant: "destructive"
      });
    }
  });

  // Handle file selection
  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      // Validate file type
      if (!file.type.startsWith('image/')) {
        toast({
          title: "Error",
          description: "Solo se permiten archivos de imagen",
          variant: "destructive"
        });
        return;
      }

      // Validate file size (5MB max)
      if (file.size > 5 * 1024 * 1024) {
        toast({
          title: "Error",
          description: "El archivo es demasiado grande. Máximo 5MB.",
          variant: "destructive"
        });
        return;
      }

      uploadLogoMutation.mutate(file);
    }
  };

  // Get organization initials for avatar fallback
  const getOrganizationInitials = () => {
    const name = organizationName || organizationInfo?.name || 'ORG';
    return name.split(' ').map(word => word.charAt(0)).join('').toUpperCase().slice(0, 2);
  };

  // Set sidebar context
  useEffect(() => {
    setSidebarContext('organizacion');
  }, [setSidebarContext]);

  return (
    <Layout 
      headerProps={{ 
        title: "Datos Básicos",
        breadcrumb: [
          { label: "Organización", href: "/organization/dashboard" },
          { label: "Datos Básicos" }
        ]
      }}
    >
      <div className="space-y-6">
        {/* FeatureIntroduction */}
        <FeatureIntroduction
          title="Datos Básicos"
          icon={<Building2 className="w-5 h-5" />}
          features={[
            {
              icon: <FileText className="w-5 h-5" />,
              title: "Información completa de la organización",
              description: "Centraliza toda la información fundamental de tu organización en un solo lugar. Desde nombre y descripción hasta datos fiscales, mantén todos los datos organizados y actualizados automáticamente."
            },
            {
              icon: <Users className="w-5 h-5" />,
              title: "Datos de contacto integrados",
              description: "Almacena la información de contacto de la organización. Teléfonos, emails y sitio web siempre disponibles para todo el equipo cuando los necesiten."
            },
            {
              icon: <MapPin className="w-5 h-5" />,
              title: "Ubicación y datos legales",
              description: "Define la ubicación exacta de la organización y los datos fiscales. Esta información se usa automáticamente en documentos oficiales y comunicaciones."
            }
          ]}
        />

        {/* Logo Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Left Column - Logo Description */}
          <div>
            <div className="flex items-center gap-2 mb-6">
              <Camera className="h-5 w-5 text-[var(--accent)]" />
              <h2 className="text-lg font-semibold">Logo de la Organización</h2>
            </div>
            <p className="text-sm text-muted-foreground">
              Sube el logo oficial de tu organización. Este logo se mostrará en documentos, reportes y comunicaciones oficiales.
              {isSaving && <span className="block text-[var(--accent)] mt-2">Guardando...</span>}
            </p>
          </div>

          {/* Right Column - Logo Upload */}
          <div>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label className="text-sm font-medium">Logo</Label>
                <div className="flex items-center gap-4">
                  <Avatar className="w-16 h-16">
                    <AvatarImage src={logoUrl} />
                    <AvatarFallback className="text-lg font-medium">
                      {getOrganizationInitials()}
                    </AvatarFallback>
                  </Avatar>
                  <div className="space-y-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => fileInputRef.current?.click()}
                      disabled={isUploadingLogo}
                    >
                      {isUploadingLogo ? (
                        <>
                          <Upload className="w-3 h-3 mr-1 animate-spin" />
                          Subiendo...
                        </>
                      ) : (
                        "Cambiar"
                      )}
                    </Button>
                    <p className="text-xs text-muted-foreground">
                      Sube una imagen (JPG, PNG) - Máximo 5MB
                    </p>
                  </div>
                </div>
                
                {/* Hidden file input */}
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleFileSelect}
                  className="hidden"
                />
              </div>
            </div>
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
              {isSaving && <span className="block text-[var(--accent)] mt-2">Guardando...</span>}
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
                <PhoneInput 
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

        {/* Saving indicator */}
        {isSaving && (
          <div className="flex items-center gap-2 text-xs text-muted-foreground justify-center mt-8">
            <div className="w-2 h-2 bg-accent rounded-full animate-pulse"></div>
            Guardando...
          </div>
        )}
      </div>
    </Layout>
  );
}