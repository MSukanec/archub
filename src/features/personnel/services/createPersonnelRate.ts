import { apiRequest } from '@/lib/queryClient';
export interface CreatePersonnelRateData {
  organization_id: string;
  personnel_id: string;
  pay_type: 'hour'| 'day'| 'month';
  rate_hour?: number | null;
  rate_day?: number | null;
  rate_month?: number | null;
  currency_id: string;
  valid_from: string;
  valid_to?: string | null;
  is_active?: boolean;
}
export async function createPersonnelRate(
  personnelId: string,
  data: CreatePersonnelRateData
): Promise<any> {
  const response = await apiRequest(
    'POST',
    `/api/personnel/${personnelId}/rates`,
    data
  );
  if (response.ok) {
    return await response.json();
  }
  const errorData = await response.json();
  throw new Error(errorData.error || 'Failed to create personnel rate');
}
