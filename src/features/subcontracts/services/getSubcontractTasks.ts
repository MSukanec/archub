export interface SubcontractTaskData {
  id: string;
  subcontract_id: string;
  task_id: string;
  unit: string;
  amount: number;
  notes: string | null;
  created_at: string;
  task_name: string;
  task_description: string;
  unit_symbol: string;
  rubro_name: string;
}

export async function getSubcontractTasks(subcontractId: string): Promise<SubcontractTaskData[]> {
  if (!subcontractId) {
    return [];
  }

  const response = await fetch(`/api/subcontract-tasks/${subcontractId}`);
  if (!response.ok) {
    throw new Error('Failed to fetch subcontract tasks');
  }

  const data = await response.json();
  return data || [];
}
