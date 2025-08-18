import { Users } from 'lucide-react';

interface MemberClientsProps {
  organization: any;
}

export function MemberClients({ organization }: MemberClientsProps) {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <Users className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-20" />
          <p className="text-muted-foreground">Próximamente: Gestión de clientes</p>
        </div>
      </div>
    </div>
  );
}