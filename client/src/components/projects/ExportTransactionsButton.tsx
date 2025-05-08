import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Download, Loader2 } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import * as XLSX from "xlsx";

interface Transaction {
  id: number;
  projectId: number;
  date: string;
  type: string;
  category: string;
  description: string;
  amount: number;
}

interface Project {
  id: number;
  name: string;
  description: string | null;
  status: string;
}

interface ExportTransactionsButtonProps {
  projectId: string | number;
}

export function ExportTransactionsButton({ projectId }: ExportTransactionsButtonProps) {
  const [isExporting, setIsExporting] = useState(false);

  // Obtener datos del proyecto
  const { data: project } = useQuery<Project>({
    queryKey: [`/api/projects/${projectId}`],
    enabled: !!projectId,
  });

  // Obtener transacciones
  const { data: transactions = [] } = useQuery<Transaction[]>({
    queryKey: [`/api/projects/${projectId}/transactions`],
    enabled: !!projectId,
  });

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("es-AR", {
      style: "currency",
      currency: "ARS",
    }).format(amount);
  };

  const handleExport = async () => {
    if (!project || transactions.length === 0) {
      toast({
        title: "No hay datos para exportar",
        description: "El proyecto no tiene transacciones registradas.",
        variant: "destructive",
      });
      return;
    }

    try {
      setIsExporting(true);

      // Preparar los datos para la exportación
      const formattedTransactions = transactions.map((transaction) => ({
        Fecha: new Date(transaction.date).toLocaleDateString("es-AR"),
        Tipo: transaction.type === "ingreso" ? "Ingreso" : "Egreso",
        Categoría: transaction.category.replace(/_/g, " ").replace(/\b\w/g, c => c.toUpperCase()),
        Descripción: transaction.description,
        Monto: formatCurrency(transaction.amount)
      }));

      // Crear el libro de trabajo y la hoja
      const worksheet = XLSX.utils.json_to_sheet(formattedTransactions);
      
      // Ajustar anchos de columna
      const columnWidths = [
        { wch: 12 }, // Fecha
        { wch: 10 }, // Tipo
        { wch: 20 }, // Categoría
        { wch: 35 }, // Descripción
        { wch: 15 }, // Monto
      ];
      worksheet["!cols"] = columnWidths;

      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, "Transacciones");

      // Generar el archivo y descargarlo
      const fileName = `transacciones_${project.name.replace(/\s+/g, "_").toLowerCase()}_${new Date().toISOString().split("T")[0]}.xlsx`;
      XLSX.writeFile(workbook, fileName);

      toast({
        title: "Exportación completada",
        description: `Se ha descargado el archivo "${fileName}"`,
      });

    } catch (error) {
      console.error("Error al exportar transacciones:", error);
      toast({
        title: "Error al exportar",
        description: "Ha ocurrido un error al exportar las transacciones. Intente nuevamente.",
        variant: "destructive",
      });
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <Button
      variant="outline"
      size="sm"
      onClick={handleExport}
      disabled={isExporting || transactions.length === 0}
    >
      {isExporting ? (
        <>
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          Exportando...
        </>
      ) : (
        <>
          <Download className="mr-2 h-4 w-4" />
          Exportar a Excel
        </>
      )}
    </Button>
  );
}