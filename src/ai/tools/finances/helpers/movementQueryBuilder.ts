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
  client?: string;
  member?: string;
  indirect?: string;
  general_cost?: string;
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
    client?: boolean;
    member?: boolean;
  };
  includeConcepts?: {
    type?: boolean;
    category?: boolean;
  };
  includeIndirect?: boolean;
  includeGeneralCost?: boolean;
}

/**
 * Construye una query optimizada de movimientos seleccionando SOLO los campos necesarios
 * de movements_view. PostgreSQL's query planner optimizará automáticamente los JOINs
 * no utilizados.
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
  const fields = getMovementSelectFields(options);
  
  return supabase
    .from('movements_view')
    .select(fields) as any;
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

  // Roles - TODOS los roles deben estar soportados
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

  if (options.includeRoles?.client) {
    fields.push('client');
  }

  if (options.includeRoles?.member) {
    fields.push('member');
  }

  // Indirects
  if (options.includeIndirect) {
    fields.push('indirect');
  }

  // General Costs
  if (options.includeGeneralCost) {
    fields.push('general_cost');
  }

  return fields.join(', ');
}
