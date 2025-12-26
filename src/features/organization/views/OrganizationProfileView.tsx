import { useState, useEffect, useCallback, useRef } from 'react';
import { Building2, FileText, Users, Globe } from 'lucide-react';
import { AvatarUploader } from '@/components/shared/fields/AvatarUploader';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { PhoneField } from '@/components/shared/fields/PhoneField';
import { useCurrentUser } from '@/hooks/use-current-user';
import { useAutosaveController, normalizeStringValue } from '@/core/autosave';
import { organizationKeys } from '@/core/query-keys';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { useToast } from '@/hooks/use-toast';
import { getOrganizationInitials } from '@/utils/initials';
import { uploadOrgLogo } from '@/lib/storage';
export function OrganizationProfileView() {
  const { data: userData } = useCurrentUser();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const organizationId = userData?.organization?.id;
  const [isHydrated, setIsHydrated] = useState(false);
  const hasHydratedRef = useRef(false);
  const { data: organizationData, isSuccess: organizationDataSuccess } = useQuery({
    queryKey: organizationKeys.data(organizationId),
    queryFn: async () => {
      if (!organizationId || !supabase) return null;
      
      const { data, error } = await supabase
        .from('organization_data')
        .select('*')
        .eq('organization_id', organizationId)
        .single();
        
      if (error && error.code !== 'PGRST116') {
        console.error('Error fetching organization data:', error);
        throw error;
      }
      
      return data;
    },
    enabled: !!organizationId && !!supabase
  });
  const { data: organizationInfo, isSuccess: organizationInfoSuccess } = useQuery({
    queryKey: organizationKeys.info(organizationId),
    queryFn: async () => {
      if (!organizationId || !supabase) return null;
      
      const { data, error } = await supabase
        .from('organizations')
        .select('*')
        .eq('is_deleted', false)
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
  const [organizationName, setOrganizationName] = useState('');
  const [logoUrl, setLogoUrl] = useState('');
  const [description, setDescription] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [website, setWebsite] = useState('');
  const [taxId, setTaxId] = useState('');
  const [isLogoUploading, setIsLogoUploading] = useState(false);
  const saveController = useAutosaveController({
    queryKey: organizationKeys.data(organizationId),
    saveFn: async (dataToSave: any) => {
      if (!organizationId || !supabase) throw new Error('Organization or Supabase not available');
      const normalizedData = {
        name: normalizeStringValue(dataToSave.name),
        description: normalizeStringValue(dataToSave.description),
        phone: normalizeStringValue(dataToSave.phone),
        email: normalizeStringValue(dataToSave.email),
        website: normalizeStringValue(dataToSave.website),
        tax_id: normalizeStringValue(dataToSave.tax_id),
      };
      if (normalizedData.name !== undefined && normalizedData.name !== null) {
        const { error: orgError } = await supabase
          .from('organizations')
          .update({ name: normalizedData.name })
          .eq('id', organizationId);
        if (orgError) throw orgError;
      }
      const organizationDataFields = {
        description: normalizedData.description,
        phone: normalizedData.phone,
        email: normalizedData.email,
        website: normalizedData.website,
        tax_id: normalizedData.tax_id,
      };
      const { data: existingData } = await supabase
        .from('organization_data')
        .select('id')
        .eq('organization_id', organizationId)
        .single();
      if (existingData) {
        const { error } = await supabase
          .from('organization_data')
          .update(organizationDataFields)
          .eq('organization_id', organizationId);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('organization_data')
          .insert({
            organization_id: organizationId,
            ...organizationDataFields
          });
        if (error) throw error;
      }
    },
    additionalQueryKeys: [organizationKeys.info(organizationId), ['current-user']],
    errorMessage: "No se pudieron guardar los cambios",
    debounceMs: 500,
  });
  const { isSaving, hasUnsavedChanges } = saveController;
  const getCurrentFormData = useCallback(() => ({
    name: organizationName,
    description,
    phone,
    email,
    website,
    tax_id: taxId
  }), [organizationName, description, phone, email, website, taxId]);
  const isFormValid = useCallback((formData: any): boolean => {
    const nameValue = formData.name?.trim();
    if (!nameValue) return false;
    return true;
  }, []);
  const handleTextFieldBlur = useCallback(() => {
    if (!isHydrated) return;
    
    const formData = getCurrentFormData();
    if (!isFormValid(formData)) return;
    
    saveController.save(formData);
  }, [isHydrated, saveController, getCurrentFormData, isFormValid]);
  const handleTextFieldKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter'&& !e.shiftKey) {
      e.preventDefault();
      if (!isHydrated) return;
      
      const formData = getCurrentFormData();
      if (!isFormValid(formData)) return;
      
      saveController.save(formData);
    }
  }, [isHydrated, saveController, getCurrentFormData, isFormValid]);
  useEffect(() => {
    setIsHydrated(false);
    hasHydratedRef.current = false;
  }, [organizationId]);
  useEffect(() => {
    if (!organizationInfoSuccess || !organizationDataSuccess || hasHydratedRef.current) {
      return;
    }
    hasHydratedRef.current = true;
    if (organizationInfo) {
      setOrganizationName(organizationInfo.name || '');
      if (organizationInfo.image_bucket && organizationInfo.image_path) {
        const { data } = supabase.storage
          .from(organizationInfo.image_bucket)
          .getPublicUrl(organizationInfo.image_path);
        setLogoUrl(data.publicUrl);
      } else {
        setLogoUrl('');
      }
    }
    if (organizationData) {
      setDescription(organizationData.description || '');
      setPhone(organizationData.phone || '');
      setEmail(organizationData.email || '');
      setWebsite(organizationData.website || '');
      setTaxId(organizationData.tax_id || '');
    }
    setTimeout(() => {
      setIsHydrated(true);
      
      saveController.setLastPersistedData({
        name: organizationInfo?.name || '',
        description: organizationData?.description || '',
        phone: organizationData?.phone || '',
        email: organizationData?.email || '',
        website: organizationData?.website || '',
        tax_id: organizationData?.tax_id || '',
      });
    }, 100);
  }, [organizationInfo, organizationData, organizationInfoSuccess, organizationDataSuccess, saveController]);
  const handleLogoSelect = async (file: File) => {
    if (!organizationId) return;
    
    setIsLogoUploading(true);
    try {
      const result = await uploadOrgLogo(file, organizationId);
      
      const { error } = await supabase
        .from('organizations')
        .update({
          image_bucket: result.bucket,
          image_path: result.file_path
        })
        .eq('id', organizationId);
      
      if (error) throw error;
      
      if (result.file_url) {
        setLogoUrl(result.file_url);
      }
      
      queryClient.invalidateQueries({ queryKey: organizationKeys.info(organizationId) });
      queryClient.invalidateQueries({ queryKey: ['current-user'] });
      
      toast({
        title: "Logo actualizado",
        description: "El logo de la organización se ha actualizado correctamente",
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "No se pudo subir el logo",
        variant: "destructive"
      });
    } finally {
      setIsLogoUploading(false);
    }
  };
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div>
          <div className="flex items-center gap-2 mb-6">
            <Building2 className="h-5 w-5 text-[var(--accent)]" />
            <h2 className="text-lg font-semibold">Logo de la Organización</h2>
            {organizationInfo?.settings?.is_founder === true && (
              <Badge variant="organization-founder">Fundador</Badge>
            )}
          </div>
          <p className="text-sm text-muted-foreground">
            Sube el logo oficial de tu organización. Este logo se mostrará en documentos, reportes y comunicaciones oficiales.
          </p>
        </div>
        <div>
          <AvatarUploader
            avatarUrl={logoUrl}
            initials={getOrganizationInitials(organizationName || organizationInfo?.name || '')}
            displayName={organizationName || organizationInfo?.name || 'Organización'}
            onAvatarSelect={handleLogoSelect}
            isUploading={isLogoUploading}
          />
        </div>
      </div>
      <hr className="border-t border-[var(--section-divider)] my-8" />
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div>
          <div className="flex items-center gap-2 mb-6">
            <FileText className="h-5 w-5 text-[var(--accent)]" />
            <h2 className="text-lg font-semibold">Información Básica</h2>
          </div>
          <p className="text-sm text-muted-foreground">
            Datos fundamentales de la organización que se usarán en todo el sistema. Estos campos son la base para proyectos, documentos y comunicaciones.
          </p>
        </div>
        <div>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="organization-name">Nombre de la Organización</Label>
              <Input 
                id="organization-name"
                placeholder="Ej: Constructora López SA"
                value={organizationName}
                onChange={(e) => setOrganizationName(e.target.value)}
                onBlur={handleTextFieldBlur}
                onKeyDown={handleTextFieldKeyDown}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="description">Descripción</Label>
              <Textarea 
                id="description"
                placeholder="Descripción de la organización..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                onBlur={handleTextFieldBlur}
                rows={3}
              />
            </div>
          </div>
        </div>
      </div>
      <hr className="border-t border-[var(--section-divider)] my-8" />
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div>
          <div className="flex items-center gap-2 mb-6">
            <Users className="h-5 w-5 text-[var(--accent)]" />
            <h2 className="text-lg font-semibold">Información de Contacto</h2>
          </div>
          <p className="text-sm text-muted-foreground">
            Datos de contacto de la organización. Esta información estará disponible para todo el equipo y se usará en comunicaciones oficiales.
          </p>
        </div>
        <div>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="phone">Teléfono</Label>
              <PhoneField 
                value={phone}
                onChange={setPhone}
                onBlur={handleTextFieldBlur}
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
                onBlur={handleTextFieldBlur}
                onKeyDown={handleTextFieldKeyDown}
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
                onBlur={handleTextFieldBlur}
                onKeyDown={handleTextFieldKeyDown}
              />
            </div>
          </div>
        </div>
      </div>
      <hr className="border-t border-[var(--section-divider)] my-8" />
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div>
          <div className="flex items-center gap-2 mb-6">
            <Globe className="h-5 w-5 text-[var(--accent)]" />
            <h2 className="text-lg font-semibold">Información Legal</h2>
          </div>
          <p className="text-sm text-muted-foreground">
            Datos fiscales y legales de la organización. Esta información se usa en facturación, contratos y documentación oficial.
          </p>
        </div>
        <div>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="tax-id">CUIT/CUIL/ID Fiscal</Label>
              <Input 
                id="tax-id"
                placeholder="Ej: 20-12345678-9"
                value={taxId}
                onChange={(e) => setTaxId(e.target.value)}
                onBlur={handleTextFieldBlur}
                onKeyDown={handleTextFieldKeyDown}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
