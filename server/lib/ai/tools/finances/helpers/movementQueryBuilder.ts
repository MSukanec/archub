import type { SupabaseClient } from '@supabase/supabase-js';

export interface MovementRow {
  amount?: number;
  organization_id?: string;
  movement_date?: string;
  description?: string;
  wallet_name?: string;
  project_name?: string;
  currency_symbol?: string;
  currency_code?: string;
  exchange_rate?: number;
  type_name?: string;
  category_name?: string;
  partner?: string;
  subcontract?: string;
  subcontract_contact?: string;
  personnel?: string;
  member?: string;
  indirect?: string;
}

export interface MovementQueryOptions {
  includeProject?: boolean;
  includeCurrency?: boolean;
  includeWallet?: boolean;
  includeDescription?: boolean;
  includeRoles?: {
    partner?: boolean;
    subcontract?: boolean;
    personnel?: boolean;
    member?: boolean;
  };
  includeConcepts?: {
    type?: boolean;
    category?: boolean;
  };
  includeIndirect?: boolean;
}

/**
 * Construye una query optimizada de movimientos desde la tabla movements con JOINs.
 * 
 * CRÍTICO: Para subcontracts, incluye tanto subcontract (título) como subcontract_contact (nombre del contacto)
 * 
 * @param supabase - Cliente de Supabase
 * @param options - Opciones para incluir campos específicos
 * @returns Query builder de Supabase configurado con los campos mínimos necesarios
 */
export function buildMovementQuery(
  supabase: SupabaseClient,
  options: MovementQueryOptions = {}
): any {
  // Build the select string with JOINs based on options
  // NOTE: FK hints are only required when there are multiple FKs to the same table (e.g., movement_concepts)
  // For tables with single FK relationships, Supabase can infer automatically
  const selectParts: string[] = [
    'amount',
    'organization_id',
    'movement_date'
  ];

  if (options.includeDescription) {
    selectParts.push('description');
  }

  if (options.includeProject) {
    selectParts.push('projects(name)');
  }

  if (options.includeCurrency) {
    selectParts.push('currencies(code, symbol)');
    selectParts.push('exchange_rate');
  }

  if (options.includeWallet) {
    selectParts.push('organization_wallets(wallets(name))');
  }

  if (options.includeConcepts?.type) {
    selectParts.push('movement_types:movement_concepts!movements_type_id_fkey(name)');
  }

  if (options.includeConcepts?.category) {
    selectParts.push('movement_categories:movement_concepts!movements_category_id_fkey(name)');
  }

  // Role fields - partner is a direct column on movements table
  if (options.includeRoles?.partner) {
    selectParts.push('partner');
  }

  // Subcontracts - join through movement_subcontracts junction table
  if (options.includeRoles?.subcontract) {
    selectParts.push('movement_subcontracts(subcontracts(title, contacts(first_name, last_name)))');
  }

  // Personnel - join through movement_personnel junction table
  if (options.includeRoles?.personnel) {
    selectParts.push('movement_personnel(personnel(contacts(first_name, last_name)))');
  }

  // Member (creator) - profiles table
  if (options.includeRoles?.member) {
    selectParts.push('profiles(full_name)');
  }

  // Indirect costs
  if (options.includeIndirect) {
    selectParts.push('indirect_id');
    selectParts.push('indirect_costs(name)');
  }

  return supabase
    .from('movements')
    .select(selectParts.join(', ')) as any;
}

/**
 * Helper para construir el string de campos SELECT optimizado.
 * Solo incluye los campos que realmente se necesitan, permitiendo que
 * PostgreSQL optimice los JOINs automáticamente.
 * 
 * @param options - Opciones de qué campos incluir
 * @returns String de campos separados por coma para .select()
 */
export function getMovementSelectFields(options: MovementQueryOptions = {}): string {
  const fields: string[] = [];

  // Campos base siempre incluidos
  fields.push('amount', 'organization_id');

  // Movement date (muy común, incluir si no se especifica lo contrario)
  fields.push('movement_date');

  // Description
  if (options.includeDescription) {
    fields.push('description');
  }

  // Proyectos
  if (options.includeProject) {
    fields.push('project_name');
  }

  // Monedas (incluye exchange_rate siempre que se solicite currency)
  if (options.includeCurrency) {
    fields.push('currency_symbol', 'currency_code', 'exchange_rate');
  }

  // Wallets
  if (options.includeWallet) {
    fields.push('wallet_name');
  }

  // Conceptos
  if (options.includeConcepts?.type) {
    fields.push('type_name');
  }

  if (options.includeConcepts?.category) {
    fields.push('category_name');
  }

  // Roles - supported roles (client and general_cost no longer available as tables were deleted)
  if (options.includeRoles?.partner) {
    fields.push('partner');
  }

  if (options.includeRoles?.subcontract) {
    // CRÍTICO: Incluir AMBOS campos para subcontracts
    fields.push('subcontract'); // Título del subcontrato
    fields.push('subcontract_contact'); // Nombre del subcontratista (contacto)
  }

  if (options.includeRoles?.personnel) {
    fields.push('personnel');
  }

  if (options.includeRoles?.member) {
    fields.push('member');
  }

  // Indirects
  if (options.includeIndirect) {
    fields.push('indirect');
  }

  return fields.join(', ');
}
