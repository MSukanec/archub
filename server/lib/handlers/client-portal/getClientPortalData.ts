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
  unit_name: string | null;
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
  commitment_name: string | null;
  commitment_amount: number | null;
  commitment_currency_code: string | null;
  commitment_currency_symbol: string | null;
  commitment_percentage: number | null;
  cumulative_percentage: number | null;
  wallet_name: string | null;
  exchange_rate: number | null;
  receipt_url: string | null;
  receipt_name: string | null;
}

export interface ClientPortalSiteLogFile {
  id: string;
  file_url: string;
  file_name: string | null;
  file_type: string;
}

export interface ClientPortalSiteLogCreator {
  full_name: string | null;
  avatar_url: string | null;
}

export interface ClientPortalSiteLog {
  id: string;
  log_date: string;
  created_at: string | null;
  comments: string | null;
  weather: string | null;
  type_name: string | null;
  files: ClientPortalSiteLogFile[];
  creator: ClientPortalSiteLogCreator | null;
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

export interface ClientPortalSettings {
  show_dashboard: boolean;
  show_installments: boolean;
  show_payments: boolean;
  show_logs: boolean;
  show_amounts: boolean;
  show_progress: boolean;
  allow_comments: boolean;
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
  settings: ClientPortalSettings;
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

  console.log('[ClientPortal] isAdminPreview:', isAdminPreview, 'clients found:', projectClients?.length || 0);

  const clients: ClientPortalClient[] = (projectClients || []).map((pc: any) => ({
    id: pc.contact?.id || '',
    project_client_id: pc.id,
    contact_id: pc.contact_id,
    first_name: pc.contact?.first_name,
    last_name: pc.contact?.last_name,
    full_name: pc.contact?.full_name,
    email: pc.contact?.email,
    phone: pc.contact?.phone,
    unit: null,
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
    console.log('[ClientPortal] Selected client:', selectedClient.id, 'project_client_id:', selectedClient.project_client_id);
    
    const { data: commitmentData, error: commitmentError } = await supabase
      .from('client_commitments')
      .select(`
        id,
        amount,
        commitment_method,
        unit_name,
        currency:currencies (
          code,
          symbol
        )
      `)
      .eq('project_id', projectId)
      .eq('client_id', selectedClient.project_client_id)
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
        unit_name: (commitmentData as any).unit_name || null,
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
        exchange_rate,
        wallet_id,
        currency:currencies (
          code,
          symbol
        ),
        commitment:client_commitments (
          id,
          commitment_method,
          amount
        )
      `)
      .eq('project_id', projectId)
      .eq('client_id', selectedClient.project_client_id)
      .eq('organization_id', organizationId)
      .eq('status', 'confirmed')
      .order('payment_date', { ascending: false });

    if (paymentsError) {
      console.error('Error fetching payments:', paymentsError);
    }

    // Fetch wallet names separately from organization_wallets (junction table)
    // organization_wallets.id is stored in client_payments.wallet_id
    // organization_wallets links to wallets table which has the name
    const walletIdsSet = new Set((paymentsData || []).map((p: any) => p.wallet_id).filter(Boolean));
    const walletIds = Array.from(walletIdsSet);
    let walletsMap: Record<string, string> = {};
    
    if (walletIds.length > 0) {
      const { data: walletsData, error: walletsError } = await supabase
        .from('organization_wallets')
        .select(`
          id,
          wallets (
            name
          )
        `)
        .in('id', walletIds);
      
      if (walletsError) {
        console.error('[ClientPortal] Error fetching wallets:', walletsError);
      }
      
      if (walletsData) {
        walletsData.forEach((w: any) => {
          if (w.wallets?.name) {
            walletsMap[w.id] = w.wallets.name;
          }
        });
      }
      
      console.log('[ClientPortal Payments] walletsData:', walletsData);
    }

    // Fetch receipt files for payments
    const paymentIds = (paymentsData || []).map((p: any) => p.id);
    let receiptMap: Record<string, { url: string; name: string | null }> = {};
    
    if (paymentIds.length > 0) {
      const { data: receiptLinks } = await supabase
        .from('media_links')
        .select(`
          client_payment_id,
          media_file:media_files (
            id,
            file_url,
            file_name,
            bucket,
            file_path
          )
        `)
        .in('client_payment_id', paymentIds);
      
      if (receiptLinks) {
        // Process all receipt files and generate signed URLs in parallel
        const receiptPromises = (receiptLinks as any[])
          .filter(link => link.client_payment_id && link.media_file)
          .map(async (link) => {
            const mediaFile = link.media_file;
            let fileUrl = mediaFile.file_url;
            
            // Generate signed URL for private/social buckets
            const bucket = mediaFile.bucket;
            const filePath = mediaFile.file_path;
            
            if (bucket && filePath && (bucket === 'private-assets' || bucket === 'social-assets')) {
              const { data: signedUrlData } = await supabase.storage
                .from(bucket)
                .createSignedUrl(filePath, 3600);
              
              if (signedUrlData?.signedUrl) {
                fileUrl = signedUrlData.signedUrl;
              }
            }
            
            return {
              paymentId: link.client_payment_id,
              url: fileUrl,
              name: mediaFile.file_name,
            };
          });
        
        // Execute all signed URL generations in parallel
        const resolvedReceipts = await Promise.all(receiptPromises);
        
        for (const { paymentId, url, name } of resolvedReceipts) {
          receiptMap[paymentId] = { url, name };
        }
      }
    }

    // Debug logging for wallet issues
    console.log('[ClientPortal Payments] wallet_ids:', walletIds);
    console.log('[ClientPortal Payments] walletsMap:', walletsMap);
    
    // First pass: map payments with basic info
    const paymentsRaw = (paymentsData || []).map((p: any) => {
      const paymentAmount = parseFloat(p.amount as string);
      const commitmentAmount = commitment?.amount || null;
      const paymentExchangeRate = p.exchange_rate ? parseFloat(p.exchange_rate) : null;
      const paymentCurrencyCode = p.currency?.code || stats.currency_code;
      const commitmentCurrencyCode = commitment?.currency_code || stats.currency_code;
      
      // Only convert when payment currency differs from commitment currency
      const needsConversion = paymentCurrencyCode !== commitmentCurrencyCode && paymentExchangeRate && paymentExchangeRate > 0;
      
      // Calculate this payment's percentage of commitment
      // exchange_rate represents: 1 unit of payment currency = X units of commitment currency
      // Example: 1 USD = 1420 ARS, so payment in USD * 1420 = amount in ARS
      let commitmentPercentage: number | null = null;
      if (commitmentAmount && commitmentAmount > 0) {
        if (needsConversion) {
          // Payment is in different currency, convert to commitment currency by MULTIPLYING
          const paymentInCommitmentCurrency = paymentAmount * paymentExchangeRate!;
          commitmentPercentage = Math.round((paymentInCommitmentCurrency / commitmentAmount) * 100);
        } else {
          // Payment is in same currency as commitment, use directly
          commitmentPercentage = Math.round((paymentAmount / commitmentAmount) * 100);
        }
      }
      
      // Calculate normalized amount for cumulative tracking (in commitment currency)
      // MULTIPLY by exchange_rate to convert to commitment currency
      const normalizedAmount = needsConversion
        ? paymentAmount * paymentExchangeRate!
        : paymentAmount;
      
      return {
        id: p.id,
        amount: paymentAmount,
        normalizedAmount,
        currency_code: p.currency?.code || stats.currency_code,
        currency_symbol: p.currency?.symbol || stats.currency_symbol,
        payment_date: p.payment_date,
        reference: p.reference,
        status: p.status,
        commitment_name: commitment?.unit_name || null,
        commitment_amount: commitmentAmount,
        commitment_currency_code: commitment?.currency_code || null,
        commitment_currency_symbol: commitment?.currency_symbol || null,
        commitment_percentage: commitmentPercentage,
        wallet_name: p.wallet_id ? walletsMap[p.wallet_id] || null : null,
        exchange_rate: paymentExchangeRate,
        receipt_url: receiptMap[p.id]?.url || null,
        receipt_name: receiptMap[p.id]?.name || null,
      };
    });

    // Calculate total_paid in commitment currency (normalized)
    let totalPaidNormalized = 0;
    for (const p of paymentsRaw) {
      totalPaidNormalized += p.normalizedAmount;
    }
    
    stats.total_paid = totalPaidNormalized;
    stats.total_pending = stats.total_commitment - stats.total_paid;

    if (stats.total_commitment > 0) {
      stats.project_progress = Math.round((stats.total_paid / stats.total_commitment) * 100);
    }

    // Calculate cumulative percentage for each payment
    // Payments are ordered by date DESC (newest first)
    // We need to calculate cumulative from oldest to newest, then assign in reverse
    const commitmentAmount = commitment?.amount || 0;
    
    console.log('[ClientPortal Cumulative] Commitment amount:', commitmentAmount);
    console.log('[ClientPortal Cumulative] Payments count:', paymentsRaw.length);
    console.log('[ClientPortal Cumulative] Payments raw data:', paymentsRaw.map(p => ({
      id: p.id,
      date: p.payment_date,
      amount: p.amount,
      normalizedAmount: p.normalizedAmount,
      exchange_rate: p.exchange_rate,
    })));
    
    // Build cumulative map
    const cumulativeMap: Record<string, number> = {};
    
    if (commitmentAmount > 0) {
      // Sort by date ASC to calculate cumulative from oldest
      const sortedByDateAsc = [...paymentsRaw].sort((a, b) => 
        new Date(a.payment_date).getTime() - new Date(b.payment_date).getTime()
      );
      
      console.log('[ClientPortal Cumulative] Sorted by date ASC:', sortedByDateAsc.map(p => ({
        id: p.id,
        date: p.payment_date,
        normalizedAmount: p.normalizedAmount,
      })));
      
      // Calculate cumulative percentages
      let runningTotal = 0;
      
      for (const p of sortedByDateAsc) {
        runningTotal += p.normalizedAmount;
        const cumulativePct = Math.round((runningTotal / commitmentAmount) * 100);
        cumulativeMap[p.id] = cumulativePct;
        console.log('[ClientPortal Cumulative] Payment', p.id.slice(0, 8), '- Added:', p.normalizedAmount, 'Running:', runningTotal, 'Cumulative %:', cumulativePct);
      }
    }
    
    console.log('[ClientPortal Cumulative] Final map:', cumulativeMap);
    
    // Map to final output format (excluding normalizedAmount)
    payments = paymentsRaw.map(p => ({
      id: p.id,
      amount: p.amount,
      currency_code: p.currency_code,
      currency_symbol: p.currency_symbol,
      payment_date: p.payment_date,
      reference: p.reference,
      status: p.status,
      commitment_name: p.commitment_name,
      commitment_amount: p.commitment_amount,
      commitment_currency_code: p.commitment_currency_code,
      commitment_currency_symbol: p.commitment_currency_symbol,
      commitment_percentage: p.commitment_percentage,
      cumulative_percentage: cumulativeMap[p.id] ?? null,
      wallet_name: p.wallet_name,
      exchange_rate: p.exchange_rate,
      receipt_url: p.receipt_url,
      receipt_name: p.receipt_name,
    }));
  }

  const { data: siteLogsData, error: siteLogsError } = await supabase
    .from('site_logs')
    .select(`
      id,
      log_date,
      created_at,
      comments,
      weather,
      site_log_type:site_log_types (
        name
      ),
      creator:organization_members (
        user:users (
          full_name,
          avatar_url
        )
      )
    `)
    .eq('project_id', projectId)
    .eq('organization_id', organizationId)
    .eq('is_public', true)
    .order('log_date', { ascending: false })
    .limit(50);

  if (siteLogsError) {
    console.error('Error fetching site logs:', siteLogsError);
  }

  const siteLogIds = (siteLogsData || []).map((l: any) => l.id);
  let filesMap: Record<string, ClientPortalSiteLogFile[]> = {};

  if (siteLogIds.length > 0) {
    const { data: mediaLinksData, error: mediaLinksError } = await supabase
      .from('media_links')
      .select(`
        id,
        site_log_id,
        media_file:media_files (
          id,
          file_url,
          file_name,
          file_type,
          bucket,
          file_path
        )
      `)
      .in('site_log_id', siteLogIds);

    if (!mediaLinksError && mediaLinksData) {
      // Process all files and generate signed URLs in parallel
      const filePromises = (mediaLinksData as any[])
        .filter(link => link.site_log_id && link.media_file)
        .map(async (link) => {
          const mediaFile = link.media_file;
          let fileUrl = mediaFile.file_url;
          
          // For private/social buckets, generate signed URL
          const bucket = mediaFile.bucket;
          const filePath = mediaFile.file_path;
          
          if (bucket && filePath && (bucket === 'private-assets' || bucket === 'social-assets')) {
            const { data: signedUrlData } = await supabase.storage
              .from(bucket)
              .createSignedUrl(filePath, 3600); // 1 hour expiry
            
            if (signedUrlData?.signedUrl) {
              fileUrl = signedUrlData.signedUrl;
            }
          }
          
          return {
            siteLogId: link.site_log_id,
            file: {
              id: mediaFile.id,
              file_url: fileUrl,
              file_name: mediaFile.file_name,
              file_type: mediaFile.file_type || 'image',
            }
          };
        });
      
      // Execute all signed URL generations in parallel
      const resolvedFiles = await Promise.all(filePromises);
      
      // Build the filesMap from resolved results
      for (const { siteLogId, file } of resolvedFiles) {
        if (!filesMap[siteLogId]) {
          filesMap[siteLogId] = [];
        }
        filesMap[siteLogId].push(file);
      }
    }
  }

  const site_logs: ClientPortalSiteLog[] = (siteLogsData || []).map((log: any) => ({
    id: log.id,
    log_date: log.log_date,
    created_at: log.created_at,
    comments: log.comments,
    weather: log.weather,
    type_name: log.site_log_type?.name || null,
    files: filesMap[log.id] || [],
    creator: log.creator?.user ? {
      full_name: log.creator.user.full_name,
      avatar_url: log.creator.user.avatar_url,
    } : null,
  }));

  const { data: portalSettings } = await supabase
    .from('client_portal_settings')
    .select('*')
    .eq('project_id', projectId)
    .maybeSingle();

  const settings: ClientPortalSettings = {
    show_dashboard: portalSettings?.show_dashboard ?? true,
    show_installments: portalSettings?.show_installments ?? true,
    show_payments: portalSettings?.show_payments ?? true,
    show_logs: portalSettings?.show_logs ?? true,
    show_amounts: portalSettings?.show_amounts ?? true,
    show_progress: portalSettings?.show_progress ?? true,
    allow_comments: portalSettings?.allow_comments ?? false,
  };

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
    settings,
  };
}
