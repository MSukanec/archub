// server/lib/handlers/projects/purchaseOrders.ts
import type { ProjectsContext } from './shared.js';
import { ensureAuth, ensureOrganizationAccess, getProjectById } from './shared.js';

export interface PurchaseOrder {
  id: string;
  project_id: string;
  organization_id: string;
  requested_by: string | null;
  approved_by: string | null;
  provider_id: string | null;
  order_date: string;
  status: 'draft' | 'sent' | 'quoted' | 'approved' | 'rejected' | 'converted';
  notes: string | null;
  created_at: string;
  updated_at: string;
  requester?: {
    id: string;
    user: {
      id: string;
      full_name: string;
      avatar_url: string | null;
    } | null;
  } | null;
  approver?: {
    id: string;
    user: {
      id: string;
      full_name: string;
      avatar_url: string | null;
    } | null;
  } | null;
  provider?: {
    id: string;
    full_name: string | null;
    company_name: string | null;
  } | null;
  project?: {
    id: string;
    name: string;
  } | null;
  items?: PurchaseOrderItem[];
}

export interface PurchaseOrderItem {
  id: string;
  purchase_order_id: string;
  description: string;
  quantity: number;
  unit_id: string | null;
  notes: string | null;
  created_at: string;
  created_by: string | null;
  unit?: {
    id: string;
    name: string;
    description: string | null;
  } | null;
}

export interface ListPurchaseOrdersParams {
  projectId: string;
  organizationId: string;
}

export type ListPurchaseOrdersResult =
  | { success: true; data: PurchaseOrder[] }
  | { success: false; error: string };

export interface GetPurchaseOrderByIdParams {
  projectId: string;
  orderId: string;
  organizationId: string;
}

export type GetPurchaseOrderByIdResult =
  | { success: true; data: PurchaseOrder }
  | { success: false; error: string };

export interface CreatePurchaseOrderParams {
  projectId: string;
  organizationId: string;
  orderData: {
    provider_id?: string | null;
    order_date: string;
    status: 'draft' | 'sent' | 'quoted' | 'approved' | 'rejected' | 'converted';
    notes?: string | null;
  };
  items: Array<{
    description: string;
    quantity: number;
    unit_id?: string | null;
    notes?: string | null;
  }>;
}

export type CreatePurchaseOrderResult =
  | { success: true; data: PurchaseOrder }
  | { success: false; error: string };

export interface UpdatePurchaseOrderParams {
  projectId: string;
  orderId: string;
  organizationId: string;
  orderData: {
    provider_id?: string | null;
    order_date?: string;
    status?: 'draft' | 'sent' | 'quoted' | 'approved' | 'rejected' | 'converted';
    notes?: string | null;
    approved_by?: string | null;
  };
  items?: Array<{
    id?: string;
    description: string;
    quantity: number;
    unit_id?: string | null;
    notes?: string | null;
  }>;
}

export type UpdatePurchaseOrderResult =
  | { success: true; data: PurchaseOrder }
  | { success: false; error: string };

export interface DeletePurchaseOrderParams {
  projectId: string;
  orderId: string;
  organizationId: string;
}

export type DeletePurchaseOrderResult =
  | { success: true }
  | { success: false; error: string };

const VALID_STATUSES = ['draft', 'sent', 'quoted', 'approved', 'rejected', 'converted'] as const;

async function fetchOrderWithRelations(
  supabase: any,
  orderId: string,
  organizationId: string
): Promise<PurchaseOrder | null> {
  const { data: order, error } = await supabase
    .from('material_purchase_orders')
    .select(`
      *,
      requester:organization_members!requested_by (
        id,
        users (
          id,
          full_name,
          avatar_url
        )
      ),
      approver:organization_members!approved_by (
        id,
        users (
          id,
          full_name,
          avatar_url
        )
      ),
      provider:contacts!provider_id (
        id,
        full_name,
        company_name
      ),
      project:projects!project_id (
        id,
        name
      )
    `)
    .eq('id', orderId)
    .eq('organization_id', organizationId)
    .single();

  if (error || !order) return null;

  const { data: items, error: itemsError } = await supabase
    .from('material_purchase_order_items')
    .select(`
      *,
      unit:units!unit_id (
        id,
        name,
        description
      )
    `)
    .eq('purchase_order_id', orderId)
    .order('created_at', { ascending: true });

  return {
    ...order,
    requester: order.requester ? {
      id: order.requester.id,
      user: order.requester.users || null
    } : null,
    approver: order.approver ? {
      id: order.approver.id,
      user: order.approver.users || null
    } : null,
    provider: order.provider || null,
    project: order.project || null,
    items: (items || []).map((item: any) => ({
      ...item,
      unit: item.unit || null
    }))
  };
}

export async function listPurchaseOrders(
  ctx: ProjectsContext,
  params: ListPurchaseOrdersParams
): Promise<ListPurchaseOrdersResult> {
  try {
    const { supabase } = ctx;

    if (!params.projectId || !params.organizationId) {
      return { success: false, error: 'projectId and organizationId are required' };
    }

    const authResult = await ensureAuth(ctx);
    if (!authResult.success) {
      return authResult;
    }

    const orgAccessResult = await ensureOrganizationAccess(ctx, params.organizationId);
    if (!orgAccessResult.success) {
      return orgAccessResult;
    }

    const projectResult = await getProjectById(ctx, params.projectId);
    if (!projectResult.success) {
      return projectResult;
    }

    if (projectResult.data.organization_id !== params.organizationId) {
      return { success: false, error: 'Forbidden: Project does not belong to organization' };
    }

    const { data: orders, error } = await supabase
      .from('material_purchase_orders')
      .select(`
        *,
        requester:organization_members!requested_by (
          id,
          users (
            id,
            full_name,
            avatar_url
          )
        ),
        approver:organization_members!approved_by (
          id,
          users (
            id,
            full_name,
            avatar_url
          )
        ),
        provider:contacts!provider_id (
          id,
          full_name,
          company_name
        ),
        project:projects!project_id (
          id,
          name
        )
      `)
      .eq('project_id', params.projectId)
      .eq('organization_id', params.organizationId)
      .order('order_date', { ascending: false });

    if (error) {
      console.error('Error fetching purchase orders:', error);
      return { success: false, error: 'Failed to fetch purchase orders' };
    }

    const orderIds = (orders || []).map(o => o.id);
    let itemsMap: Record<string, PurchaseOrderItem[]> = {};

    if (orderIds.length > 0) {
      const { data: items, error: itemsError } = await supabase
        .from('material_purchase_order_items')
        .select(`
          *,
          unit:units!unit_id (
            id,
            name,
            description
          )
        `)
        .in('purchase_order_id', orderIds)
        .order('created_at', { ascending: true });

      if (!itemsError && items) {
        items.forEach((item: any) => {
          if (!itemsMap[item.purchase_order_id]) {
            itemsMap[item.purchase_order_id] = [];
          }
          itemsMap[item.purchase_order_id].push({
            ...item,
            unit: item.unit || null
          });
        });
      }
    }

    const mappedOrders = (orders || []).map((order: any) => ({
      ...order,
      requester: order.requester ? {
        id: order.requester.id,
        user: order.requester.users || null
      } : null,
      approver: order.approver ? {
        id: order.approver.id,
        user: order.approver.users || null
      } : null,
      provider: order.provider || null,
      project: order.project || null,
      items: itemsMap[order.id] || []
    }));

    return { success: true, data: mappedOrders };

  } catch (error: any) {
    console.error('Error in listPurchaseOrders handler:', error);
    return { success: false, error: error.message || 'Failed to list purchase orders' };
  }
}

export async function getPurchaseOrderById(
  ctx: ProjectsContext,
  params: GetPurchaseOrderByIdParams
): Promise<GetPurchaseOrderByIdResult> {
  try {
    const { supabase } = ctx;

    if (!params.projectId || !params.orderId || !params.organizationId) {
      return { success: false, error: 'projectId, orderId and organizationId are required' };
    }

    const authResult = await ensureAuth(ctx);
    if (!authResult.success) {
      return authResult;
    }

    const orgAccessResult = await ensureOrganizationAccess(ctx, params.organizationId);
    if (!orgAccessResult.success) {
      return orgAccessResult;
    }

    const projectResult = await getProjectById(ctx, params.projectId);
    if (!projectResult.success) {
      return projectResult;
    }

    if (projectResult.data.organization_id !== params.organizationId) {
      return { success: false, error: 'Forbidden: Project does not belong to organization' };
    }

    const order = await fetchOrderWithRelations(supabase, params.orderId, params.organizationId);

    if (!order) {
      return { success: false, error: 'Purchase order not found' };
    }

    if (order.project_id !== params.projectId) {
      return { success: false, error: 'Forbidden' };
    }

    return { success: true, data: order };

  } catch (error: any) {
    console.error('Error in getPurchaseOrderById handler:', error);
    return { success: false, error: error.message || 'Failed to get purchase order' };
  }
}

export async function createPurchaseOrder(
  ctx: ProjectsContext,
  params: CreatePurchaseOrderParams
): Promise<CreatePurchaseOrderResult> {
  try {
    const { supabase } = ctx;

    if (!params.projectId || !params.organizationId) {
      return { success: false, error: 'projectId and organizationId are required' };
    }

    if (!params.items || params.items.length === 0) {
      return { success: false, error: 'At least one item is required' };
    }

    const authResult = await ensureAuth(ctx);
    if (!authResult.success) {
      return authResult;
    }

    const orgAccessResult = await ensureOrganizationAccess(ctx, params.organizationId);
    if (!orgAccessResult.success) {
      return orgAccessResult;
    }

    const projectResult = await getProjectById(ctx, params.projectId);
    if (!projectResult.success) {
      return projectResult;
    }

    if (projectResult.data.organization_id !== params.organizationId) {
      return { success: false, error: 'Forbidden: Project does not belong to organization' };
    }

    const insertPayload = {
      project_id: params.projectId,
      organization_id: params.organizationId,
      requested_by: orgAccessResult.memberId,
      provider_id: params.orderData.provider_id || null,
      order_date: params.orderData.order_date,
      status: params.orderData.status,
      notes: params.orderData.notes || null,
    };

    const { data: newOrder, error: insertError } = await supabase
      .from('material_purchase_orders')
      .insert([insertPayload])
      .select('id')
      .single();

    if (insertError) {
      console.error('Error creating purchase order:', insertError);
      return { success: false, error: 'Failed to create purchase order' };
    }

    const itemsToInsert = params.items.map(item => ({
      purchase_order_id: newOrder.id,
      organization_id: params.organizationId,
      project_id: params.projectId,
      description: item.description,
      quantity: item.quantity,
      unit_id: item.unit_id || null,
      notes: item.notes || null,
      created_by: orgAccessResult.memberId,
    }));

    const { error: itemsError } = await supabase
      .from('material_purchase_order_items')
      .insert(itemsToInsert);

    if (itemsError) {
      console.error('Error creating purchase order items:', itemsError);
      await supabase.from('material_purchase_orders').delete().eq('id', newOrder.id);
      return { success: false, error: 'Failed to create purchase order items' };
    }

    const createdOrder = await fetchOrderWithRelations(supabase, newOrder.id, params.organizationId);

    if (!createdOrder) {
      return { success: false, error: 'Failed to fetch created purchase order' };
    }

    return { success: true, data: createdOrder };

  } catch (error: any) {
    console.error('Error in createPurchaseOrder handler:', error);
    return { success: false, error: error.message || 'Failed to create purchase order' };
  }
}

export async function updatePurchaseOrder(
  ctx: ProjectsContext,
  params: UpdatePurchaseOrderParams
): Promise<UpdatePurchaseOrderResult> {
  try {
    const { supabase } = ctx;

    if (!params.projectId || !params.orderId || !params.organizationId) {
      return { success: false, error: 'projectId, orderId and organizationId are required' };
    }

    const authResult = await ensureAuth(ctx);
    if (!authResult.success) {
      return authResult;
    }

    const orgAccessResult = await ensureOrganizationAccess(ctx, params.organizationId);
    if (!orgAccessResult.success) {
      return orgAccessResult;
    }

    const projectResult = await getProjectById(ctx, params.projectId);
    if (!projectResult.success) {
      return projectResult;
    }

    if (projectResult.data.organization_id !== params.organizationId) {
      return { success: false, error: 'Forbidden: Project does not belong to organization' };
    }

    const { data: existingOrder, error: fetchError } = await supabase
      .from('material_purchase_orders')
      .select('id, project_id, organization_id')
      .eq('id', params.orderId)
      .single();

    if (fetchError || !existingOrder) {
      return { success: false, error: 'Purchase order not found' };
    }

    if (existingOrder.project_id !== params.projectId || existingOrder.organization_id !== params.organizationId) {
      return { success: false, error: 'Forbidden' };
    }

    const updatePayload: any = {
      updated_at: new Date().toISOString()
    };

    if (params.orderData.provider_id !== undefined) updatePayload.provider_id = params.orderData.provider_id;
    if (params.orderData.order_date !== undefined) updatePayload.order_date = params.orderData.order_date;
    if (params.orderData.status !== undefined) updatePayload.status = params.orderData.status;
    if (params.orderData.notes !== undefined) updatePayload.notes = params.orderData.notes;
    if (params.orderData.approved_by !== undefined) updatePayload.approved_by = params.orderData.approved_by;

    const { error: updateError } = await supabase
      .from('material_purchase_orders')
      .update(updatePayload)
      .eq('id', params.orderId);

    if (updateError) {
      console.error('Error updating purchase order:', updateError);
      return { success: false, error: 'Failed to update purchase order' };
    }

    if (params.items && params.items.length > 0) {
      await supabase
        .from('material_purchase_order_items')
        .delete()
        .eq('purchase_order_id', params.orderId);

      const itemsToInsert = params.items.map(item => ({
        purchase_order_id: params.orderId,
        organization_id: params.organizationId,
        project_id: params.projectId,
        description: item.description,
        quantity: item.quantity,
        unit_id: item.unit_id || null,
        notes: item.notes || null,
        created_by: orgAccessResult.memberId,
      }));

      const { error: itemsError } = await supabase
        .from('material_purchase_order_items')
        .insert(itemsToInsert);

      if (itemsError) {
        console.error('Error updating purchase order items:', itemsError);
        return { success: false, error: 'Failed to update purchase order items' };
      }
    }

    const updatedOrder = await fetchOrderWithRelations(supabase, params.orderId, params.organizationId);

    if (!updatedOrder) {
      return { success: false, error: 'Failed to fetch updated purchase order' };
    }

    return { success: true, data: updatedOrder };

  } catch (error: any) {
    console.error('Error in updatePurchaseOrder handler:', error);
    return { success: false, error: error.message || 'Failed to update purchase order' };
  }
}

export async function deletePurchaseOrder(
  ctx: ProjectsContext,
  params: DeletePurchaseOrderParams
): Promise<DeletePurchaseOrderResult> {
  try {
    const { supabase } = ctx;

    if (!params.projectId || !params.orderId || !params.organizationId) {
      return { success: false, error: 'projectId, orderId and organizationId are required' };
    }

    const authResult = await ensureAuth(ctx);
    if (!authResult.success) {
      return authResult;
    }

    const orgAccessResult = await ensureOrganizationAccess(ctx, params.organizationId);
    if (!orgAccessResult.success) {
      return orgAccessResult;
    }

    const projectResult = await getProjectById(ctx, params.projectId);
    if (!projectResult.success) {
      return projectResult;
    }

    if (projectResult.data.organization_id !== params.organizationId) {
      return { success: false, error: 'Forbidden: Project does not belong to organization' };
    }

    const { data: existingOrder, error: fetchError } = await supabase
      .from('material_purchase_orders')
      .select('id, project_id, organization_id')
      .eq('id', params.orderId)
      .single();

    if (fetchError || !existingOrder) {
      return { success: false, error: 'Purchase order not found' };
    }

    if (existingOrder.project_id !== params.projectId || existingOrder.organization_id !== params.organizationId) {
      return { success: false, error: 'Forbidden' };
    }

    const { error: deleteError } = await supabase
      .from('material_purchase_orders')
      .delete()
      .eq('id', params.orderId);

    if (deleteError) {
      console.error('Error deleting purchase order:', deleteError);
      return { success: false, error: 'Failed to delete purchase order' };
    }

    return { success: true };

  } catch (error: any) {
    console.error('Error in deletePurchaseOrder handler:', error);
    return { success: false, error: error.message || 'Failed to delete purchase order' };
  }
}
