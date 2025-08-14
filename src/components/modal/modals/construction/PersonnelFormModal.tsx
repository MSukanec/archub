import React from 'react';

interface PersonnelFormModalProps {
  data?: any;
}

export function PersonnelFormModal({ data }: PersonnelFormModalProps) {
  return (
    <div className="p-6">
      <h2 className="text-lg font-semibold mb-4">Modal de Personal</h2>
      <p className="text-muted-foreground">Modal temporalmente vacío para evitar errores.</p>
    </div>
  );
}