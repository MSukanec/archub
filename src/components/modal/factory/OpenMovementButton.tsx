import React from 'react';
import { Button } from '@/components/ui/button';
import { useGlobalModalStore } from './useGlobalModalStore';
import { DollarSign } from 'lucide-react';

export function OpenMovementButton() {
  const { openModal } = useGlobalModalStore();

  const handleClick = () => {
    openModal("movement", { 
      id: "1234",
      title: "Movimiento de Prueba",
      amount: 15000 
    });
  };

  return (
    <Button onClick={handleClick} variant="outline">
      <DollarSign className="h-4 w-4 mr-2" />
      Abrir Modal Movimiento
    </Button>
  );
}