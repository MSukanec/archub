import React from 'react';
import DataRowCard from '../DataRowCard';
import { Calendar } from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

// Interface para entrada del changelog
interface ChangelogEntry {
  id: string;
  title: string;
  description: string;
  type: string;
  date: string;
  is_public: boolean;
  created_at: string;
  created_by: string;
  creator?: {
    id: string;
    full_name: string;
    email: string;
    avatar_url?: string;
  } | null;
}

interface AdminChangelogRowProps {
  entry: ChangelogEntry;
  onClick?: () => void;
  selected?: boolean;
  density?: 'compact' | 'normal' | 'comfortable';
  className?: string;
}

// Componente para mostrar la fecha de la entrada
const EntryDate = ({ date }: { date: string }) => {
  return (
    <div className="text-right">
      <div className="flex items-center justify-end gap-1 text-xs text-muted-foreground">
        <Calendar className="w-3 h-3" />
        <span>{format(new Date(date), 'dd/MM/yy', { locale: es })}</span>
      </div>
    </div>
  );
};

export default function AdminChangelogRow({ 
  entry, 
  onClick, 
  selected, 
  density = 'normal',
  className 
}: AdminChangelogRowProps) {
  
  // Contenido interno del card usando el nuevo sistema
  const cardContent = (
    <>
      {/* Columna de contenido (principal) */}
      <div className="flex-1 min-w-0">
        {/* Primera fila - Título */}
        <div className="font-semibold text-sm truncate">
          {entry.title}
        </div>

        {/* Segunda fila - Tipo */}
        <div className="text-xs text-muted-foreground truncate">
          {entry.type}
        </div>
      </div>

      {/* Trailing Section - Fecha */}
      <div className="flex items-center">
        <EntryDate date={entry.date} />
        {/* Espacio mínimo para chevron si existe */}
        {onClick && <div className="w-2" />}
      </div>
    </>
  );

  // Usar el nuevo DataRowCard
  return (
    <DataRowCard
      selected={selected}
      density={density}
      onClick={onClick}
      className={className}
      data-testid={`changelog-row-${entry.id}`}
    >
      {cardContent}
    </DataRowCard>
  );
}

// Export del tipo para uso externo
export type { ChangelogEntry };