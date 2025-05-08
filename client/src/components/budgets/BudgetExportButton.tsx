import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { useQuery } from "@tanstack/react-query";
import { LucideFileDown, LucideFileText, LucideFileSpreadsheet } from "lucide-react";
import { BudgetPdfPreview } from "./BudgetPdfPreview";
import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';
import { format } from "date-fns";
import { es } from "date-fns/locale";

// Interfaces
interface Task {
  id: number;
  name: string;
  category: string;
  unit: string;
  unitPrice: number;
}

interface BudgetTask {
  id: number;
  taskId: number;
  budgetId: number;
  quantity: number;
  task: Task;
}

interface Budget {
  id: number;
  name: string;
  description: string | null;
  projectId: number | null;
}

interface Project {
  id: number;
  name: string;
  description: string | null;
}

interface Organization {
  id: number;
  name: string;
  description: string | null;
  address: string | null;
  phone: string | null;
  email: string | null;
  website: string | null;
  taxId: string | null;
  logoUrl: string | null;
  pdfConfig?: {
    logoPosition: "left" | "center" | "right";
    showAddress: boolean;
    showPhone: boolean;
    showEmail: boolean;
    showWebsite: boolean;
    showTaxId: boolean;
    primaryColor: string;
    secondaryColor: string;
  };
}

interface BudgetExportButtonProps {
  budgetId: number;
  projectId: number;
}

export function BudgetExportButton({ budgetId, projectId }: BudgetExportButtonProps) {
  const { toast } = useToast();
  const [showPdfPreview, setShowPdfPreview] = useState(false);
  const [exportInProgress, setExportInProgress] = useState(false);
  
  // Obtener datos necesarios para exportar
  const { data: budget } = useQuery<Budget>({
    queryKey: [`/api/budgets/${budgetId}`],
  });
  
  const { data: project } = useQuery<Project>({
    queryKey: [`/api/projects/${projectId}`],
    enabled: !!projectId,
  });
  
  const { data: budgetTasks = [] } = useQuery<BudgetTask[]>({
    queryKey: [`/api/budgets/${budgetId}/tasks`],
  });
  
  // Obtener la organización activa
  const { data: organization } = useQuery<Organization>({
    queryKey: ["/api/organizations/active"],
  });
  
  // Maneja la exportación a PDF
  const handleExportPdf = () => {
    setShowPdfPreview(true);
  };
  
  // Descargar PDF
  const handleSavePdf = (dataUrl: string) => {
    if (!budget) return;
    
    try {
      const link = document.createElement('a');
      link.href = dataUrl;
      link.download = `presupuesto_${budget.name.replace(/\s+/g, '_').toLowerCase()}_${format(new Date(), 'yyyy-MM-dd')}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      toast({
        title: "PDF Exportado",
        description: "El presupuesto ha sido exportado como PDF correctamente.",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: `No se pudo exportar el PDF: ${error}`,
        variant: "destructive",
      });
    }
  };
  
  // Exportar a Excel
  const handleExportExcel = async () => {
    if (!budget || !budgetTasks.length) return;
    
    setExportInProgress(true);
    
    try {
      // Datos para la cabecera
      const headerData = [
        [`Presupuesto: ${budget.name}`],
        [`Fecha: ${format(new Date(), "d 'de' MMMM 'de' yyyy", { locale: es })}`],
        [`Proyecto: ${project?.name || 'Sin proyecto'}`],
        [],
      ];
      
      // Crear una hoja de cálculo con las tareas
      const tasksSheet = [
        ['Categoría', 'Tarea', 'Unidad', 'Cantidad', 'Precio Unitario', 'Total'],
        ...budgetTasks.map(bt => [
          bt.task.category,
          bt.task.name,
          bt.task.unit,
          bt.quantity,
          bt.task.unitPrice,
          bt.quantity * bt.task.unitPrice
        ]),
        [],
        [
          '', 
          '', 
          '', 
          '', 
          'TOTAL',
          budgetTasks.reduce((acc, bt) => acc + (bt.quantity * bt.task.unitPrice), 0)
        ],
      ];
      
      // Crear hoja por categorías
      const categoriesData: Record<string, any[][]> = {};
      const categories = [...new Set(budgetTasks.map(bt => bt.task.category))];
      
      categories.forEach(category => {
        const categoryTasks = budgetTasks.filter(bt => bt.task.category === category);
        
        categoriesData[category] = [
          ['Tarea', 'Unidad', 'Cantidad', 'Precio Unitario', 'Total'],
          ...categoryTasks.map(bt => [
            bt.task.name,
            bt.task.unit,
            bt.quantity,
            bt.task.unitPrice,
            bt.quantity * bt.task.unitPrice
          ]),
          [],
          [
            '', 
            '', 
            '', 
            'TOTAL',
            categoryTasks.reduce((acc, bt) => acc + (bt.quantity * bt.task.unitPrice), 0)
          ],
        ];
      });
      
      // Crear el libro de trabajo
      const workbook = XLSX.utils.book_new();
      
      // Añadir la hoja principal
      const mainSheet = [...headerData, ...tasksSheet];
      XLSX.utils.book_append_sheet(
        workbook, 
        XLSX.utils.aoa_to_sheet(mainSheet), 
        'Presupuesto'
      );
      
      // Añadir hojas por categoría
      categories.forEach(category => {
        XLSX.utils.book_append_sheet(
          workbook, 
          XLSX.utils.aoa_to_sheet(categoriesData[category]), 
          category.slice(0, 31) // Excel limita los nombres de hoja a 31 caracteres
        );
      });
      
      // Convertir a binario y descargar
      const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
      const blob = new Blob([excelBuffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
      saveAs(blob, `presupuesto_${budget.name.replace(/\s+/g, '_').toLowerCase()}_${format(new Date(), 'yyyy-MM-dd')}.xlsx`);
      
      toast({
        title: "Excel Exportado",
        description: "El presupuesto ha sido exportado como Excel correctamente.",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: `No se pudo exportar el Excel: ${error}`,
        variant: "destructive",
      });
    } finally {
      setExportInProgress(false);
    }
  };
  
  // Verificar que tenemos todos los datos necesarios
  const canExport = !!budget && !!budgetTasks.length && !!organization;
  
  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button 
            variant="default" 
            className="bg-primary hover:bg-primary/90"
            disabled={!canExport || exportInProgress}
          >
            <LucideFileDown className="mr-2 h-4 w-4" />
            Exportar
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent>
          <DropdownMenuLabel>Formato de exportación</DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={handleExportPdf} disabled={exportInProgress}>
            <LucideFileText className="mr-2 h-4 w-4" />
            Exportar como PDF
          </DropdownMenuItem>
          <DropdownMenuItem onClick={handleExportExcel} disabled={exportInProgress}>
            <LucideFileSpreadsheet className="mr-2 h-4 w-4" />
            Exportar como Excel
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
      
      {/* Diálogo para vista previa del PDF */}
      <Dialog open={showPdfPreview} onOpenChange={setShowPdfPreview}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle>Vista previa del PDF</DialogTitle>
            <DialogDescription>
              Previsualiza el documento PDF antes de descargarlo.
            </DialogDescription>
          </DialogHeader>
          
          {canExport && showPdfPreview && (
            <div className="mt-4">
              <BudgetPdfPreview 
                organization={organization!}
                project={project || { id: 0, name: "Sin proyecto", description: null }}
                budget={budget!}
                budgetTasks={budgetTasks}
                onPreviewGenerated={handleSavePdf}
              />
            </div>
          )}
          
          <div className="flex justify-end mt-4">
            <Button 
              variant="outline" 
              onClick={() => setShowPdfPreview(false)}
              className="mr-2"
            >
              Cerrar
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}