import { useState, useEffect } from 'react';
import { Building2, ImageIcon, FileText, Users, MapPin, Phone, Mail, Globe } from 'lucide-react';

import { Layout } from '@/components/layout/desktop/Layout';
import { FeatureIntroduction } from '@/components/ui-custom/FeatureIntroduction';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';

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
  const [slug, setSlug] = useState('');
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

  // Auto-save mutation for organization data
  const saveOrganizationDataMutation = useMutation({
    mutationFn: async (dataToSave: any) => {
      if (!organizationId || !supabase) return;

      // Update organization name in organizations table
      if (dataToSave.name !== undefined) {
        const { error: orgError } = await supabase
          .from('organizations')
          .update({ name: dataToSave.name })
          .eq('id', organizationId);

        if (orgError) throw orgError;
      }

      // Update organization data in organization_data table
      const organizationDataFields = {
        slug: dataToSave.slug,
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
        const { error } = await supabase
          .from('organization_data')
          .upsert({
            organization_id: organizationId,
            ...cleanData
          });

        if (error) throw error;
      }
    },
    onSuccess: () => {
      console.log('Auto-save completed successfully');
      queryClient.invalidateQueries({ queryKey: ['organization-data', organizationId] });
      queryClient.invalidateQueries({ queryKey: ['organization-info', organizationId] });
    },
    onError: (error) => {
      console.error('Auto-save failed:', error);
      toast({
        title: "Error al guardar",
        description: "No se pudieron guardar los cambios automáticamente",
        variant: "destructive"
      });
    }
  });

  // Initialize form data when data is loaded
  useEffect(() => {
    if (organizationInfo) {
      setOrganizationName(organizationInfo.name || '');
    }
  }, [organizationInfo]);

  useEffect(() => {
    if (organizationData) {
      setSlug(organizationData.slug || '');
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

  // Set up auto-save for all fields
  useDebouncedAutoSave(
    { name: organizationName },
    (data) => saveOrganizationDataMutation.mutate(data),
    1000
  );

  useDebouncedAutoSave(
    { slug },
    (data) => saveOrganizationDataMutation.mutate(data),
    1000
  );

  useDebouncedAutoSave(
    { description },
    (data) => saveOrganizationDataMutation.mutate(data),
    1000
  );

  useDebouncedAutoSave(
    { address, city, state, country, postal_code: postalCode },
    (data) => saveOrganizationDataMutation.mutate(data),
    1000
  );

  useDebouncedAutoSave(
    { phone, email, website, tax_id: taxId },
    (data) => saveOrganizationDataMutation.mutate(data),
    1000
  );

  // Set sidebar context
  useEffect(() => {
    setSidebarContext('organizacion');
  }, [setSidebarContext]);

  return (
    <Layout wide={false}>
      <div className="space-y-6">
        <FeatureIntroduction
          icon={<Building2 className="w-5 h-5 text-accent" />}
          title="Datos Básicos de la Organización"
          description="Gestiona la información principal y configuración de tu organización"
          features={[
            "Información general y datos de contacto",
            "Dirección y ubicación física",
            "Configuración fiscal y datos legales",
            "Personalización de slug y descripción"
          ]}
        />

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Left Column - Basic Information */}
          <div className="space-y-6">
            {/* Organization Info Section */}
            <div className="bg-[var(--card-bg)] border border-[var(--card-border)] rounded-lg p-4">
              <div className="flex items-center gap-2 mb-4">
                <Building2 className="w-4 h-4 text-accent" />
                <h3 className="font-medium text-[var(--card-fg)]">Información General</h3>
              </div>
              
              <div className="space-y-4">
                <div>
                  <Label htmlFor="organizationName">Nombre de la Organización</Label>
                  <Input
                    id="organizationName"
                    type="text"
                    value={organizationName}
                    onChange={(e) => setOrganizationName(e.target.value)}
                    placeholder="Ingresa el nombre de tu organización"
                  />
                </div>

                <div>
                  <Label htmlFor="slug">Slug (URL amigable)</Label>
                  <Input
                    id="slug"
                    type="text"
                    value={slug}
                    onChange={(e) => setSlug(e.target.value)}
                    placeholder="mi-organizacion"
                  />
                </div>

                <div>
                  <Label htmlFor="description">Descripción</Label>
                  <Textarea
                    id="description"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Descripción de tu organización..."
                    rows={3}
                  />
                </div>
              </div>
            </div>

            {/* Contact Information Section */}
            <div className="bg-[var(--card-bg)] border border-[var(--card-border)] rounded-lg p-4">
              <div className="flex items-center gap-2 mb-4">
                <Users className="w-4 h-4 text-accent" />
                <h3 className="font-medium text-[var(--card-fg)]">Información de Contacto</h3>
              </div>
              
              <div className="space-y-4">
                <div>
                  <Label htmlFor="phone">Teléfono</Label>
                  <Input
                    id="phone"
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="+54 11 1234-5678"
                  />
                </div>

                <div>
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="contacto@miorganizacion.com"
                  />
                </div>

                <div>
                  <Label htmlFor="website">Sitio Web</Label>
                  <Input
                    id="website"
                    type="url"
                    value={website}
                    onChange={(e) => setWebsite(e.target.value)}
                    placeholder="https://www.miorganizacion.com"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Right Column - Address and Legal */}
          <div className="space-y-6">
            {/* Address Section */}
            <div className="bg-[var(--card-bg)] border border-[var(--card-border)] rounded-lg p-4">
              <div className="flex items-center gap-2 mb-4">
                <MapPin className="w-4 h-4 text-accent" />
                <h3 className="font-medium text-[var(--card-fg)]">Dirección</h3>
              </div>
              
              <div className="space-y-4">
                <div>
                  <Label htmlFor="address">Dirección</Label>
                  <Input
                    id="address"
                    type="text"
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    placeholder="Av. Corrientes 1234"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="city">Ciudad</Label>
                    <Input
                      id="city"
                      type="text"
                      value={city}
                      onChange={(e) => setCity(e.target.value)}
                      placeholder="Buenos Aires"
                    />
                  </div>

                  <div>
                    <Label htmlFor="state">Provincia/Estado</Label>
                    <Input
                      id="state"
                      type="text"
                      value={state}
                      onChange={(e) => setState(e.target.value)}
                      placeholder="CABA"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="country">País</Label>
                    <Input
                      id="country"
                      type="text"
                      value={country}
                      onChange={(e) => setCountry(e.target.value)}
                      placeholder="Argentina"
                    />
                  </div>

                  <div>
                    <Label htmlFor="postalCode">Código Postal</Label>
                    <Input
                      id="postalCode"
                      type="text"
                      value={postalCode}
                      onChange={(e) => setPostalCode(e.target.value)}
                      placeholder="C1043"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Legal Information Section */}
            <div className="bg-[var(--card-bg)] border border-[var(--card-border)] rounded-lg p-4">
              <div className="flex items-center gap-2 mb-4">
                <FileText className="w-4 h-4 text-accent" />
                <h3 className="font-medium text-[var(--card-fg)]">Información Legal</h3>
              </div>
              
              <div className="space-y-4">
                <div>
                  <Label htmlFor="taxId">CUIT/CUIL/ID Fiscal</Label>
                  <Input
                    id="taxId"
                    type="text"
                    value={taxId}
                    onChange={(e) => setTaxId(e.target.value)}
                    placeholder="20-12345678-9"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}