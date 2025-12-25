import { useQuery, useMutation } from '@tanstack/react-query';
import { queryClient, apiRequest } from '@/lib/queryClient';
import type { PdfTemplate, InsertPdfTemplate } from '@shared/schema';

export const PDF_TEMPLATE_QUERY_KEYS = {
  all: ['pdf-templates'] as const,
  detail: (organizationId: string) => ['pdf-templates', organizationId] as const,
};

/**
 * Hook to fetch the PDF template for an organization
 */
export function usePdfTemplate(organizationId: string | undefined) {
  return useQuery<PdfTemplate | null>({
    queryKey: PDF_TEMPLATE_QUERY_KEYS.detail(organizationId || ''),
    queryFn: async () => {
      if (!organizationId) return null;
      try {
        const response = await fetch(`/api/organizations/${organizationId}/pdf-template`, {
          credentials: 'include',
        });
        if (response.status === 404 || !response.ok) {
          return null;
        }
        const data = await response.json();
        return data.template || null;
      } catch (error) {
        console.error('Error fetching PDF template:', error);
        return null;
      }
    },
    enabled: !!organizationId,
    retry: 1,
    staleTime: 1000 * 60 * 5,
  });
}

/**
 * Hook to create a PDF template for an organization
 */
export function useCreatePdfTemplate() {
  return useMutation({
    mutationFn: async ({ organizationId, data }: { organizationId: string; data: Partial<InsertPdfTemplate> }) => {
      const response = await apiRequest('POST', `/api/organizations/${organizationId}/pdf-template`, data);
      return response;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ 
        queryKey: PDF_TEMPLATE_QUERY_KEYS.detail(variables.organizationId) 
      });
    },
  });
}

/**
 * Hook to update the PDF template for an organization
 */
export function useUpdatePdfTemplate() {
  return useMutation({
    mutationFn: async ({ organizationId, data }: { organizationId: string; data: Partial<InsertPdfTemplate> }) => {
      const response = await apiRequest('PATCH', `/api/organizations/${organizationId}/pdf-template`, data);
      return response;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ 
        queryKey: PDF_TEMPLATE_QUERY_KEYS.detail(variables.organizationId) 
      });
    },
  });
}

/**
 * Default PDF template values
 */
export const DEFAULT_PDF_TEMPLATE: Partial<InsertPdfTemplate> = {
  name: 'Plantilla por defecto',
  logo_width: 80,
  logo_height: 60,
  company_name_show: true,
  company_name_size: 24,
  company_name_color: '#1f2937',
  company_info_size: 10,
  primary_color: '#4f9eff',
  secondary_color: '#e5e7eb',
  text_color: '#1f2937',
  background_color: '#ffffff',
  font_family: 'Arial',
  title_size: 18,
  subtitle_size: 14,
  body_size: 12,
  page_size: 'A4',
  page_orientation: 'portrait',
  margin_top: 20,
  margin_bottom: 20,
  margin_left: 20,
  margin_right: 20,
  show_client_section: true,
  show_project_section: true,
  show_details_section: true,
  show_signature_section: true,
  footer_info: 'Documento generado por Seencel. www.seencel.com',
  show_footer_info: true,
  footer_show_page_numbers: true,
  footer_show_date: true,
  show_signature_fields: true,
  signature_layout: 'vertical',
  show_clarification_field: true,
  show_date_field: true,
};
