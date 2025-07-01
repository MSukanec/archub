// Utility function to transform Movement data to MovementCard format
export function transformMovementToCard(movement: any) {
  return {
    id: movement.id,
    date: movement.movement_date || movement.created_at,
    creator: {
      name: movement.creator?.full_name || 'Usuario desconocido',
      avatar_url: movement.creator?.avatar_url
    },
    type: movement.movement_data?.type?.name === 'Ingreso' ? 'Ingreso' as const : 'Egreso' as const,
    category: movement.movement_data?.category?.name || 'Sin categoría',
    subcategory: movement.movement_data?.subcategory?.name,
    description: movement.description,
    wallet: movement.movement_data?.wallet?.name || 'Sin billetera',
    currency: movement.movement_data?.currency?.code || 'N/A',
    amount: movement.amount || 0
  };
}