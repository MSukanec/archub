import { useState } from "react";
import { Package, Plus } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui-custom/security/EmptyState";

interface TaskMaterialsViewProps {
  task: any;
}

export function TaskMaterialsView({ task }: TaskMaterialsViewProps) {
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="pb-4">
          <CardTitle className="flex items-center gap-2 text-lg">
            <Package className="h-5 w-5" />
            Materiales de la Tarea
          </CardTitle>
        </CardHeader>
        <CardContent>
          <EmptyState
            icon={<Package className="h-16 w-16" />}
            title="Sin materiales configurados"
            description="Los materiales asociados a esta tarea aparecerán aquí."
            action={
              <Button variant="outline" size="sm">
                <Plus className="h-4 w-4 mr-2" />
                Agregar Material
              </Button>
            }
          />
        </CardContent>
      </Card>
    </div>
  );
}