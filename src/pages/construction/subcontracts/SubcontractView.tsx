import { useParams } from "wouter";
import { ArrowLeft } from "lucide-react";
import { useLocation } from "wouter";

import { Layout } from '@/components/layout/desktop/Layout';
import { Button } from "@/components/ui/button";

export default function SubcontractView() {
  const { id } = useParams<{ id: string }>();
  const [, navigate] = useLocation();

  const headerProps = {
    title: "Ver Subcontrato",
    showBackButton: true,
    onBackClick: () => navigate('/construction/subcontracts')
  };

  return (
    <Layout headerProps={headerProps}>
      <div className="space-y-6">
        <div className="text-center py-8">
          <h3 className="text-lg font-medium text-muted-foreground">Vista de Subcontrato</h3>
          <p className="text-sm text-muted-foreground mt-1">
            ID del subcontrato: {id}
          </p>
          <p className="text-sm text-muted-foreground mt-1">
            Esta vista está en construcción.
          </p>
        </div>
      </div>
    </Layout>
  );
}