// src/pages/obra/PageBitacora.tsx
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { format } from "date-fns";

import { CustomPageLayout } from "@/components/ui-custom/CustomPageLayout";
import { CustomPageHeader } from "@/components/ui-custom/CustomPageHeader";
import { CustomPageBody } from "@/components/ui-custom/CustomPageBody";
import { CustomSearchButton } from "@/components/ui-custom/CustomSearchButton";
import { Button } from "@/components/ui/button";

import { useCurrentUser } from "@/hooks/use-current-user";
// import { CreateBitacoraModal } from './CreateBitacoraModal' // próximamente

interface BitacoraItem {
  id: string;
  date: string;
  description: string;
  created_by: string;
  project_id: string;
}

export default function PageBitacora() {
  const queryClient = useQueryClient();
  const { data: userData } = useCurrentUser();
  const [openModal, setOpenModal] = useState(false);

  const projectId = userData?.preferences?.last_project_id;

  const { data, isLoading, isError } = useQuery<BitacoraItem[]>({
    queryKey: ["bitacora", projectId],
    queryFn: async () => {
      const res = await fetch(`/api/bitacora?project_id=${projectId}`);
      if (!res.ok) throw new Error("Error al cargar la bitácora");
      return res.json();
    },
    enabled: !!projectId,
  });

  return (
    <CustomPageLayout>
      <CustomPageHeader
        title="Bitácora de Obra"
        description="Registro diario de avances, eventos y notas de obra"
        icon="notebook"
        rightSection={
          <div className="flex gap-2">
            <CustomSearchButton />
            <Button onClick={() => setOpenModal(true)}>Nueva entrada</Button>
          </div>
        }
      />

      <CustomPageBody>
        {isLoading && <p>Cargando bitácora...</p>}
        {isError && <p>Error al cargar la bitácora.</p>}

        {!isLoading && data?.length === 0 && (
          <p className="text-muted-foreground text-sm">No hay entradas aún.</p>
        )}

        {!isLoading && data?.length > 0 && (
          <table className="w-full text-sm border border-border rounded-md overflow-hidden">
            <thead className="bg-muted/40 text-left">
              <tr>
                <th className="p-3">Fecha</th>
                <th className="p-3">Descripción</th>
                <th className="p-3">Registrado por</th>
              </tr>
            </thead>
            <tbody>
              {data.map((item) => (
                <tr
                  key={item.id}
                  className="border-t border-border hover:bg-muted/20"
                >
                  <td className="p-3">
                    {format(new Date(item.date), "dd/MM/yyyy")}
                  </td>
                  <td className="p-3">{item.description}</td>
                  <td className="p-3">{item.created_by}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </CustomPageBody>

      {/* Modal aún no creado */}
      {/* <CreateBitacoraModal open={openModal} onClose={() => setOpenModal(false)} /> */}
    </CustomPageLayout>
  );
}
