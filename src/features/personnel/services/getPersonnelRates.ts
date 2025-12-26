import { apiRequest } from '@/lib/queryClient';
export interface PersonnelRate {
  id: string;
  personnel_id: string;
  organization_id: string;
  pay_type: 'hour'| 'day'| 'month';
  rate_hour: number | null;
  rate_day: number | null;
  rate_month: number | null;
  currency_id: string;
  valid_from: string;
  valid_to: string | null;
  is_active: boolean;
  currency?: {
    id: string;
    code: string;
    name: string;
    symbol: string;
  };
  labor_type?: {
    id: string;
    name: string;
  };
}
export async function getPersonnelRates(
  personnelId: string,
  organizationId: string
): Promise<PersonnelRate[]> {
  const response = await apiRequest(
    'GET',
    `/api/personnel/${personnelId}/rates?organization_id=${organizationId}`
  );
  if (response.ok) {
    return await response.json();
  }
  const errorData = await response.json();
  throw new Error(errorData.error || 'Failed to fetch personnel rates');
}
