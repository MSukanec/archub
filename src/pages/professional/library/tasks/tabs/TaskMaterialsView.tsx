import { useState } from "react";
import { Package, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui-custom/security/EmptyState";

interface TaskMaterialsViewProps {
  task: any;
}

export function TaskMaterialsView({ task }: TaskMaterialsViewProps) {
  return (
    <div className="space-y-6">
      <EmptyState
        icon={<Package className="h-16 w-16" />}
        title="Sin materiales configurados"
        description="Los materiales asociados a esta tarea aparecerán aquí."
        action={
          <Button variant="default" size="sm">
            <Plus className="h-4 w-4 mr-2" />
            Agregar Material
          </Button>
        }
      />
    </div>
  );
}