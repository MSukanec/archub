import type { SupabaseClient } from '@supabase/supabase-js';

export interface ClientPortalProject {
  id: string;
  name: string;
  code: string | null;
  status: string;
  color: string | null;
  start_date: string | null;
  estimated_end: string | null;
  address: string | null;
  city: string | null;
  image_url: string | null;
}

export interface ClientPortalClient {
  id: string;
  project_client_id: string;
  contact_id: string;
  first_name: string | null;
  last_name: string | null;
  full_name: string | null;
  email: string | null;
  phone: string | null;
  unit: string | null;
  is_primary: boolean;
  role_name: string | null;
}

export interface ClientPortalCommitment {
  id: string;
  amount: number;
  currency_code: string;
  currency_symbol: string;
  commitment_method: string;
}

export interface ClientPortalScheduleItem {
  id: string;
  due_date: string;
  amount: number;
  currency_code: string;
  currency_symbol: string;
  status: string;
  paid_at: string | null;
}

export interface ClientPortalPayment {
  id: string;
  amount: number;
  currency_code: string;
  currency_symbol: string;
  payment_date: string;
  reference: string | null;
  status: string;
}

export interface ClientPortalSiteLog {
  id: string;
  log_date: string;
  comments: string | null;
  weather: string | null;
  type_name: string | null;
  files_count: number;
  creator_name: string | null;
}

export interface ClientPortalStats {
  total_commitment: number;
  total_paid: number;
  total_pending: number;
  currency_code: string;
  currency_symbol: string;
  next_installment_date: string | null;
  next_installment_amount: number | null;
  project_progress: number;
}

export interface ClientPortalData {
  project: ClientPortalProject;
  client: ClientPortalClient | null;
  clients: ClientPortalClient[];
  stats: ClientPortalStats;
  commitment: ClientPortalCommitment | null;
  schedule: ClientPortalScheduleItem[];
  payments: ClientPortalPayment[];
  site_logs: ClientPortalSiteLog[];
  is_admin_preview: boolean;
}

interface GetClientPortalDataParams {
  projectId: string;
  clientId?: string;
  isAdminPreview?: boolean;
}

export async function getClientPortalData(
  supabase: SupabaseClient,
  params: GetClientPortalDataParams
): Promise<ClientPortalData> {
  const { projectId, clientId, isAdminPreview = false } = params;

  const { data: project, error: projectError } = await supabase
    .from('projects')
    .select(`
      id,
      name,
      code,
      status,
      color,
      organization_id,
      project_data (
        start_date,
        estimated_end,
        address,
        city,
        image_bucket,
        image_path
      )
    `)
    .eq('id', projectId)
    .eq('is_deleted', false)
    .single();

  if (projectError || !project) {
    throw new Error('Proyecto no encontrado');
  }

  const organizationId = project.organization_id;
  const projectData = project.project_data as any;

  let imageUrl: string | null = null;
  if (projectData?.image_bucket && projectData?.image_path) {
    const { data: signedData } = await supabase.storage
      .from(projectData.image_bucket)
      .createSignedUrl(projectData.image_path, 3600);
    imageUrl = signedData?.signedUrl || null;
  }

  const { data: projectClients, error: clientsError } = await supabase
    .from('project_clients')
    .select(`
      id,
      contact_id,
      unit,
      is_primary,
      client_role:client_roles (
        name
      ),
      contact:contacts (
        id,
        first_name,
        last_name,
        full_name,
        email,
        phone
      )
    `)
    .eq('project_id', projectId)
    .eq('organization_id', organizationId)
    .eq('status', 'active')
    .eq('is_deleted', false);

  if (clientsError) {
    console.error('Error fetching project clients:', clientsError);
  }

  const clients: ClientPortalClient[] = (projectClients || []).map((pc: any) => ({
    id: pc.contact?.id || '',
    project_client_id: pc.id,
    contact_id: pc.contact_id,
    first_name: pc.contact?.first_name,
    last_name: pc.contact?.last_name,
    full_name: pc.contact?.full_name,
    email: pc.contact?.email,
    phone: pc.contact?.phone,
    unit: pc.unit,
    is_primary: pc.is_primary,
    role_name: pc.client_role?.name || null,
  }));

  let selectedClient: ClientPortalClient | null = null;
  if (clientId) {
    selectedClient = clients.find(c => c.id === clientId) || null;
  }
  if (!selectedClient && clients.length > 0) {
    selectedClient = clients.find(c => c.is_primary) || clients[0];
  }

  let commitment: ClientPortalCommitment | null = null;
  let schedule: ClientPortalScheduleItem[] = [];
  let payments: ClientPortalPayment[] = [];
  let stats: ClientPortalStats = {
    total_commitment: 0,
    total_paid: 0,
    total_pending: 0,
    currency_code: 'ARS',
    currency_symbol: '$',
    next_installment_date: null,
    next_installment_amount: null,
    project_progress: 0,
  };

  if (selectedClient) {
    const { data: commitmentData, error: commitmentError } = await supabase
      .from('client_commitments')
      .select(`
        id,
        amount,
        commitment_method,
        currency:currencies (
          code,
          symbol
        )
      `)
      .eq('project_id', projectId)
      .eq('client_id', selectedClient.id)
      .eq('organization_id', organizationId)
      .eq('is_deleted', false)
      .maybeSingle();

    if (commitmentError) {
      console.error('Error fetching commitment:', commitmentError);
    }

    if (commitmentData) {
      const currency = commitmentData.currency as any;
      commitment = {
        id: commitmentData.id,
        amount: parseFloat(commitmentData.amount as string),
        currency_code: currency?.code || 'ARS',
        currency_symbol: currency?.symbol || '$',
        commitment_method: commitmentData.commitment_method,
      };

      stats.total_commitment = commitment.amount;
      stats.currency_code = commitment.currency_code;
      stats.currency_symbol = commitment.currency_symbol;

      const { data: scheduleData, error: scheduleError } = await supabase
        .from('client_payment_schedule')
        .select(`
          id,
          due_date,
          amount,
          status,
          paid_at,
          currency:currencies (
            code,
            symbol
          )
        `)
        .eq('commitment_id', commitmentData.id)
        .eq('organization_id', organizationId)
        .order('due_date', { ascending: true });

      if (scheduleError) {
        console.error('Error fetching schedule:', scheduleError);
      }

      schedule = (scheduleData || []).map((s: any) => ({
        id: s.id,
        due_date: s.due_date,
        amount: parseFloat(s.amount as string),
        currency_code: s.currency?.code || stats.currency_code,
        currency_symbol: s.currency?.symbol || stats.currency_symbol,
        status: s.status,
        paid_at: s.paid_at,
      }));

      const nextInstallment = schedule.find(s => s.status === 'pending');
      if (nextInstallment) {
        stats.next_installment_date = nextInstallment.due_date;
        stats.next_installment_amount = nextInstallment.amount;
      }
    }

    const { data: paymentsData, error: paymentsError } = await supabase
      .from('client_payments')
      .select(`
        id,
        amount,
        payment_date,
        reference,
        status,
        currency:currencies (
          code,
          symbol
        )
      `)
      .eq('project_id', projectId)
      .eq('client_id', selectedClient.id)
      .eq('organization_id', organizationId)
      .eq('status', 'confirmed')
      .order('payment_date', { ascending: false });

    if (paymentsError) {
      console.error('Error fetching payments:', paymentsError);
    }

    payments = (paymentsData || []).map((p: any) => ({
      id: p.id,
      amount: parseFloat(p.amount as string),
      currency_code: p.currency?.code || stats.currency_code,
      currency_symbol: p.currency?.symbol || stats.currency_symbol,
      payment_date: p.payment_date,
      reference: p.reference,
      status: p.status,
    }));

    stats.total_paid = payments.reduce((sum, p) => sum + p.amount, 0);
    stats.total_pending = stats.total_commitment - stats.total_paid;

    if (stats.total_commitment > 0) {
      stats.project_progress = Math.round((stats.total_paid / stats.total_commitment) * 100);
    }
  }

  const { data: siteLogsData, error: siteLogsError } = await supabase
    .from('site_logs')
    .select(`
      id,
      log_date,
      comments,
      weather,
      site_log_type:site_log_types (
        name
      ),
      creator:organization_members (
        user:users (
          full_name
        )
      )
    `)
    .eq('project_id', projectId)
    .eq('organization_id', organizationId)
    .eq('is_public', true)
    .order('log_date', { ascending: false })
    .limit(20);

  if (siteLogsError) {
    console.error('Error fetching site logs:', siteLogsError);
  }

  const siteLogIds = (siteLogsData || []).map((l: any) => l.id);
  let filesCountMap: Record<string, number> = {};

  if (siteLogIds.length > 0) {
    const { data: filesData, error: filesError } = await supabase
      .from('media_links')
      .select('site_log_id')
      .in('site_log_id', siteLogIds);

    if (!filesError && filesData) {
      filesData.forEach((f: any) => {
        filesCountMap[f.site_log_id] = (filesCountMap[f.site_log_id] || 0) + 1;
      });
    }
  }

  const site_logs: ClientPortalSiteLog[] = (siteLogsData || []).map((log: any) => ({
    id: log.id,
    log_date: log.log_date,
    comments: log.comments,
    weather: log.weather,
    type_name: log.site_log_type?.name || null,
    files_count: filesCountMap[log.id] || 0,
    creator_name: log.creator?.user?.full_name || null,
  }));

  return {
    project: {
      id: project.id,
      name: project.name,
      code: project.code,
      status: project.status,
      color: project.color,
      start_date: projectData?.start_date || null,
      estimated_end: projectData?.estimated_end || null,
      address: projectData?.address || null,
      city: projectData?.city || null,
      image_url: imageUrl,
    },
    client: selectedClient,
    clients,
    stats,
    commitment,
    schedule,
    payments,
    site_logs,
    is_admin_preview: isAdminPreview,
  };
}
