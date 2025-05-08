import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';
import { Download, FileDown, Loader2, FileText } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from '@/components/ui/dialog';

import { BudgetPdfPreview } from './BudgetPdfPreview';

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
  const [isPdfDialogOpen, setIsPdfDialogOpen] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [previewDataUrl, setPreviewDataUrl] = useState<string | null>(null);
  
  // Obtener datos del presupuesto
  const { data: budget } = useQuery<Budget>({
    queryKey: [`/api/budgets/${budgetId}`],
    enabled: !!budgetId,
  });
  
  // Obtener las tareas del presupuesto
  const { data: budgetTasks = [] } = useQuery<BudgetTask[]>({
    queryKey: [`/api/budgets/${budgetId}/tasks`],
    enabled: !!budgetId,
  });
  
  // Obtener datos del proyecto
  const { data: project } = useQuery<Project>({
    queryKey: [`/api/projects/${projectId}`],
    enabled: !!projectId,
  });
  
  // Obtener la organización actual
  const { data: organization } = useQuery<Organization>({
    queryKey: ['/api/organizations/current'],
  });
  
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("es-AR", {
      style: "currency",
      currency: "ARS",
      minimumFractionDigits: 2,
    }).format(amount);
  };
  
  const handleExportPDF = async () => {
    if (!budget || !project || !organization || budgetTasks.length === 0) {
      toast({
        title: "No hay datos para exportar",
        description: "Verifique que el presupuesto contiene tareas",
        variant: "destructive",
      });
      return;
    }
    
    try {
      setIsExporting(true);
      
      // Creamos el documento PDF
      const doc = new jsPDF();
      
      // Título del documento
      doc.setFontSize(18);
      doc.setTextColor(0, 0, 0);
      doc.text(`Presupuesto: ${budget.name}`, 14, 20);
      
      // Información de la organización
      doc.setFontSize(12);
      doc.text(`Organización: ${organization.name}`, 14, 30);
      if (organization.taxId) {
        doc.text(`CUIT/RUT: ${organization.taxId}`, 14, 36);
      }
      
      // Información del proyecto
      doc.text(`Proyecto: ${project.name}`, 14, 48);
      doc.text(`Fecha: ${new Date().toLocaleDateString('es-AR')}`, 14, 54);
      
      // Tabla de tareas
      const tableData = budgetTasks.map(item => [
        item.task.name,
        item.task.category,
        item.task.unit,
        item.quantity.toString(),
        formatCurrency(item.task.unitPrice),
        formatCurrency(item.quantity * item.task.unitPrice)
      ]);
      
      // Calcular el total
      const total = budgetTasks.reduce((sum, item) => {
        return sum + (item.quantity * item.task.unitPrice);
      }, 0);
      
      // Añadir fila de total
      tableData.push(['', '', '', '', 'TOTAL', formatCurrency(total)]);
      
      // Generar la tabla
      autoTable(doc, {
        head: [['Descripción', 'Categoría', 'Unidad', 'Cantidad', 'Precio Unit.', 'Subtotal']],
        body: tableData,
        startY: 65,
        theme: 'grid',
        headStyles: {
          fillColor: [146, 201, 0], // El color principal (#92c900)
          textColor: [255, 255, 255],
          fontStyle: 'bold'
        },
        footStyles: {
          fontStyle: 'bold'
        }
      });
      
      // Notas al pie
      const finalY = (doc as any).lastAutoTable.finalY + 15;
      doc.setFontSize(10);
      doc.text('Notas:', 14, finalY);
      doc.text('* Los precios pueden variar según disponibilidad y fluctuaciones de mercado.', 20, finalY + 6);
      doc.text('* Este presupuesto tiene una validez de 15 días desde su emisión.', 20, finalY + 12);
      doc.text('* Los tiempos de ejecución se acordarán según la complejidad del proyecto.', 20, finalY + 18);
      
      // Pie de página
      doc.setFontSize(8);
      doc.setTextColor(150, 150, 150);
      doc.text('Generado desde Archub - Sistema de Gestión de Proyectos de Construcción', doc.internal.pageSize.getWidth() / 2, 285, { align: 'center' });
      
      // Guardar el PDF
      const fileName = `presupuesto_${budget.name.replace(/[^a-zA-Z0-9]/g, '_').toLowerCase()}_${new Date().toISOString().split('T')[0]}.pdf`;
      doc.save(fileName);
      
      toast({
        title: "Exportación completada",
        description: `El presupuesto ha sido exportado como "${fileName}"`,
      });
      
    } catch (error) {
      console.error('Error al exportar el PDF:', error);
      toast({
        title: "Error al exportar",
        description: "No se pudo generar el archivo PDF. Intente nuevamente.",
        variant: "destructive",
      });
    } finally {
      setIsExporting(false);
      setIsPdfDialogOpen(false);
    }
  };
  
  const handleExportExcel = async () => {
    if (!budget || !project || budgetTasks.length === 0) {
      toast({
        title: "No hay datos para exportar",
        description: "Verifique que el presupuesto contiene tareas",
        variant: "destructive",
      });
      return;
    }
    
    try {
      setIsExporting(true);
      
      // Preparar datos para Excel
      const worksheetData = [
        ['Presupuesto', budget.name],
        ['Proyecto', project.name],
        ['Organización', organization?.name || ''],
        ['Fecha', new Date().toLocaleDateString('es-AR')],
        [''],
        ['Descripción', 'Categoría', 'Unidad', 'Cantidad', 'Precio Unitario', 'Subtotal']
      ];
      
      // Añadir filas de tareas
      budgetTasks.forEach(item => {
        worksheetData.push([
          item.task.name,
          item.task.category,
          item.task.unit,
          item.quantity,
          item.task.unitPrice,
          item.quantity * item.task.unitPrice
        ]);
      });
      
      // Calcular el total
      const total = budgetTasks.reduce((sum, item) => {
        return sum + (item.quantity * item.task.unitPrice);
      }, 0);
      
      // Añadir fila de total
      worksheetData.push(['', '', '', '', 'TOTAL', total]);
      
      // Crear el libro de trabajo y la hoja
      const worksheet = XLSX.utils.aoa_to_sheet(worksheetData);
      
      // Ajustar anchos de columna
      const columnWidths = [
        { wch: 25 }, // Descripción
        { wch: 15 }, // Categoría
        { wch: 10 }, // Unidad
        { wch: 10 }, // Cantidad
        { wch: 15 }, // Precio Unitario
        { wch: 15 }, // Subtotal
      ];
      worksheet['!cols'] = columnWidths;
      
      // Crear el libro y agregar la hoja
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, 'Presupuesto');
      
      // Generar y descargar el archivo
      const fileName = `presupuesto_${budget.name.replace(/[^a-zA-Z0-9]/g, '_').toLowerCase()}_${new Date().toISOString().split('T')[0]}.xlsx`;
      XLSX.writeFile(workbook, fileName);
      
      toast({
        title: "Exportación completada",
        description: `El presupuesto ha sido exportado como "${fileName}"`,
      });
      
    } catch (error) {
      console.error('Error al exportar a Excel:', error);
      toast({
        title: "Error al exportar",
        description: "No se pudo generar el archivo Excel. Intente nuevamente.",
        variant: "destructive",
      });
    } finally {
      setIsExporting(false);
    }
  };
  
  const handlePreviewGenerated = (dataUrl: string) => {
    setPreviewDataUrl(dataUrl);
  };
  
  const handleAdvancedPdfExport = async () => {
    if (!previewDataUrl) {
      toast({
        title: "Error al exportar",
        description: "No se pudo generar la previsualización del PDF. Intente nuevamente.",
        variant: "destructive",
      });
      return;
    }
    
    try {
      setIsExporting(true);
      
      // Crear un nuevo documento PDF con el tamaño de una hoja A4
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4'
      });
      
      // Añadir la imagen de la previsualización al PDF
      pdf.addImage(previewDataUrl, 'PNG', 0, 0, 210, 297);
      
      // Guardar el PDF
      const fileName = `presupuesto_${budget?.name.replace(/[^a-zA-Z0-9]/g, '_').toLowerCase()}_${new Date().toISOString().split('T')[0]}.pdf`;
      pdf.save(fileName);
      
      toast({
        title: "Exportación completada",
        description: `El presupuesto ha sido exportado como "${fileName}"`,
      });
      
    } catch (error) {
      console.error('Error al exportar el PDF avanzado:', error);
      toast({
        title: "Error al exportar",
        description: "No se pudo generar el archivo PDF. Intente nuevamente.",
        variant: "destructive",
      });
    } finally {
      setIsExporting(false);
      setIsPdfDialogOpen(false);
    }
  };
  
  if (!budget || !project || !organization) {
    return (
      <Button variant="outline" size="sm" disabled>
        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
        Cargando...
      </Button>
    );
  }
  
  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" size="sm">
            <Download className="mr-2 h-4 w-4" />
            Exportar
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuLabel>Opciones de exportación</DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={() => setIsPdfDialogOpen(true)}>
            <FileText className="mr-2 h-4 w-4" />
            Diseño PDF personalizado
          </DropdownMenuItem>
          <DropdownMenuItem onClick={handleExportPDF}>
            <FileText className="mr-2 h-4 w-4" />
            PDF simple
          </DropdownMenuItem>
          <DropdownMenuItem onClick={handleExportExcel}>
            <FileDown className="mr-2 h-4 w-4" />
            Excel
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
      
      {/* Diálogo para exportar PDF con diseño personalizado */}
      <Dialog open={isPdfDialogOpen} onOpenChange={setIsPdfDialogOpen}>
        <DialogContent className="sm:max-w-3xl">
          <DialogHeader>
            <DialogTitle>Previsualización del Presupuesto</DialogTitle>
            <DialogDescription>
              Esta es una previsualización de cómo se verá el documento exportado en formato PDF.
            </DialogDescription>
          </DialogHeader>
          
          <div className="max-h-[60vh] overflow-y-auto mt-4">
            {budget && project && organization && (
              <BudgetPdfPreview
                organization={organization}
                project={project}
                budget={budget}
                budgetTasks={budgetTasks}
                onPreviewGenerated={handlePreviewGenerated}
              />
            )}
          </div>
          
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsPdfDialogOpen(false)}
              disabled={isExporting}
            >
              Cancelar
            </Button>
            <Button
              onClick={handleAdvancedPdfExport}
              className="bg-primary hover:bg-primary/90"
              disabled={isExporting || !previewDataUrl}
            >
              {isExporting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Exportando...
                </>
              ) : (
                <>
                  <FileDown className="mr-2 h-4 w-4" />
                  Exportar PDF
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}