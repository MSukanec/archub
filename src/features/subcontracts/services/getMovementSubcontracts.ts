export interface MovementSubcontractData {
  id: string;
  movement_id: string;
  subcontract_id: string;
  created_at: string;
  subcontracts?: any;
}
export async function getMovementSubcontracts(movementId: string): Promise<MovementSubcontractData[]> {
  if (!movementId) {
    return [];
  }
  const response = await fetch(`/api/movement-subcontracts?movement_id=${movementId}`);
  if (!response.ok) {
    throw new Error('Failed to fetch movement subcontracts');
  }
  const data = await response.json();
  return data || [];
}
