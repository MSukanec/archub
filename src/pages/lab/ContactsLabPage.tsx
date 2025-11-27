import { Users } from 'lucide-react';
import { DashboardLayout } from '@/layouts';
import { LabPageLayout } from '@/layouts/lab/components/LabPageLayout';
import { useLab } from '@/layouts/lab/context/LabContext';

function ContactsLabContent() {
  const { selectedOrgId, selectedProjectId, isLoading } = useLab();

  return (
    <div className="relative h-full w-full bg-[var(--content-bg)] overflow-hidden">
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="bg-[var(--card-bg)]/60 backdrop-blur-md rounded-xl border border-[var(--border)] p-8 text-center max-w-md">
          <Users className="w-16 h-16 text-[var(--text-subtle)] mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-[var(--foreground)] mb-2">Lab - Contactos</h3>
          <p className="text-[var(--text-muted)] text-sm">
            Próximamente: Visualización de contactos de la organización.
          </p>
          {selectedOrgId && (
            <p className="text-xs text-[var(--text-subtle)] mt-4">
              Org: {selectedOrgId}
            </p>
          )}
          {selectedProjectId && (
            <p className="text-xs text-[var(--text-subtle)]">
              Proyecto: {selectedProjectId}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

export default function ContactsLabPage() {
  return (
    <DashboardLayout hideHeader wide>
      <LabPageLayout>
        <ContactsLabContent />
      </LabPageLayout>
    </DashboardLayout>
  );
}
