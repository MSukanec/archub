import type { ComparisonCategory, PlanFeatures } from "../types";
export function formatLimit(value: number | null | undefined, suffix?: string): string {
  if (value === null || value === undefined || value >= 9999) return 'Ilimitados';
  if (value === 1) return '1';
  return suffix ? `${value} ${suffix}` : String(value);
}
export function formatMembers(value: number | null | undefined): string {
  if (value === null || value === undefined || value >= 9999) return 'Ilimitados';
  return String(value);
}
export function formatStorage(mb: number | null | undefined): string {
  if (mb === null || mb === undefined) return '—';
  if (mb >= 1024) {
    const gb = (mb / 1024).toFixed(0);
    return `${gb} GB`;
  }
  return `${mb} MB`;
}
export function formatFileSize(mb: number | null | undefined): string {
  if (mb === null || mb === undefined) return '—';
  if (mb >= 1024) {
    const gb = (mb / 1024).toFixed(1);
    return `${gb} GB`;
  }
  return `${mb} MB`;
}
export function formatTokens(tokens: number | null | undefined): string {
  if (tokens === null || tokens === undefined) return '—';
  if (tokens === -1 || tokens >= 999999) return 'Ilimitados';
  if (tokens === 0) return 'Básico';
  if (tokens < 1000) return String(tokens);
  if (tokens >= 1000000) return `${(tokens / 1000000).toFixed(1)}M`;
  return `${(tokens / 1000).toFixed(0).replace(/\B(?=(\d{3})+(?!\d))/g, ',')}k`;
}
export function buildComparisonData(
  freeFeatures: PlanFeatures,
  proFeatures: PlanFeatures,
  teamsFeatures: PlanFeatures
): ComparisonCategory[] {
  return [
    {
      category: 'Gestión de Proyectos',
      rows: [
        { 
          label: 'Número de proyectos', 
          free: formatLimit(freeFeatures.max_projects),
          pro: formatLimit(proFeatures.max_projects),
          teams: formatLimit(teamsFeatures.max_projects)
        },
        { label: 'Dashboard de proyecto', free: true, pro: true, teams: true },
        { label: 'Colores personalizados por proyecto', free: true, pro: true, teams: true }
      ]
    },
    {
      category: 'Gestión Financiera',
      rows: [
        { label: 'Presupuestos', free: true, pro: true, teams: true },
        { label: 'Multi-moneda (ARS, USD)', free: true, pro: true, teams: true }
      ]
    },
    {
      category: 'Construcción',
      rows: [
        { label: 'Subcontratos', free: true, pro: true, teams: true },
        { label: 'Personal', free: true, pro: true, teams: true },
        { label: 'Bitácora de obra', free: true, pro: true, teams: true }
      ]
    },
    {
      category: 'Almacenamiento',
      rows: [
        { 
          label: 'Espacio de archivos', 
          free: formatStorage(freeFeatures.max_storage_mb),
          pro: formatStorage(proFeatures.max_storage_mb),
          teams: formatStorage(teamsFeatures.max_storage_mb)
        },
        { 
          label: 'Tamaño máximo de archivo', 
          free: formatFileSize(freeFeatures.max_file_size_mb),
          pro: formatFileSize(proFeatures.max_file_size_mb),
          teams: formatFileSize(teamsFeatures.max_file_size_mb)
        },
        { 
          label: 'PDFs personalizables', 
          free: freeFeatures.export_pdf_custom ?? false,
          pro: proFeatures.export_pdf_custom ?? true,
          teams: teamsFeatures.export_pdf_custom ?? true
        },
        { label: 'Backup (incluido en plan)', free: false, pro: true, teams: true }
      ]
    },
    {
      category: 'Inteligencia Artificial',
      rows: [
        { 
          label: 'Tokens IA/mes', 
          free: formatTokens(freeFeatures.ai_tokens || freeFeatures.max_ai_tokens),
          pro: formatTokens(proFeatures.ai_tokens || proFeatures.max_ai_tokens),
          teams: formatTokens(teamsFeatures.ai_tokens || teamsFeatures.max_ai_tokens)
        },
        { label: 'Asistente conversacional', free: false, pro: true, teams: true },
        { label: 'Análisis financiero IA', free: false, pro: true, teams: true }
      ]
    },
    {
      category: 'Colaboración',
      rows: [
        { 
          label: 'Usuarios', 
          free: formatMembers(freeFeatures.max_members),
          pro: formatMembers(proFeatures.max_members),
          teams: formatMembers(teamsFeatures.max_members)
        },
        { label: 'Roles y permisos', free: false, pro: false, teams: true },
        { label: 'Colaboración en tiempo real', free: false, pro: false, teams: true }
      ]
    },
    {
      category: 'Soporte',
      rows: [
        { label: 'Email', free: true, pro: true, teams: true },
        { label: 'Prioritario', free: false, pro: true, teams: true }
      ]
    }
  ];
}
