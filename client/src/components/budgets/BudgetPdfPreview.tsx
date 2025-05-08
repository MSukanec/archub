import { useRef, useEffect, useState } from 'react';
import { toPng } from 'html-to-image';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';

interface Organization {
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

interface Project {
  id: number;
  name: string;
  description: string | null;
}

interface Budget {
  id: number;
  name: string;
  description: string | null;
}

interface BudgetTask {
  id: number;
  quantity: number;
  task: {
    id: number;
    name: string;
    unit: string;
    unitPrice: number;
    category: string;
  };
}

interface BudgetPdfPreviewProps {
  organization: Organization;
  project: Project;
  budget: Budget;
  budgetTasks: BudgetTask[];
  previewOnly?: boolean;
  onPreviewGenerated?: (dataUrl: string) => void;
}

export function BudgetPdfPreview({ 
  organization, 
  project, 
  budget, 
  budgetTasks,
  previewOnly = true,
  onPreviewGenerated
}: BudgetPdfPreviewProps) {
  const previewRef = useRef<HTMLDivElement>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [dataUrl, setDataUrl] = useState<string | null>(null);
  
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("es-AR", {
      style: "currency",
      currency: "ARS",
      minimumFractionDigits: 2,
    }).format(amount);
  };
  
  const calculateTotal = () => {
    return budgetTasks.reduce((sum, bt) => {
      return sum + (bt.quantity * bt.task.unitPrice);
    }, 0);
  };
  
  // Generar la imagen de previsualización
  useEffect(() => {
    if (previewRef.current && !isGenerating && !dataUrl) {
      const generatePreview = async () => {
        try {
          setIsGenerating(true);
          const dataUrl = await toPng(previewRef.current!, { 
            quality: 0.95,
            backgroundColor: 'white'
          });
          setDataUrl(dataUrl);
          
          if (onPreviewGenerated) {
            onPreviewGenerated(dataUrl);
          }
        } catch (error) {
          console.error('Error al generar la previsualización:', error);
        } finally {
          setIsGenerating(false);
        }
      };
      
      // Pequeño retraso para asegurar que el componente esté renderizado completamente
      const timeoutId = setTimeout(generatePreview, 300);
      return () => clearTimeout(timeoutId);
    }
  }, [previewRef, isGenerating, dataUrl, onPreviewGenerated]);
  
  const logoPosition = organization.pdfConfig?.logoPosition || "left";
  const primaryColor = organization.pdfConfig?.primaryColor || "#92c900";
  const secondaryColor = organization.pdfConfig?.secondaryColor || "#333333";
  
  // Solo para previsualización, usamos una imagen estática
  if (previewOnly && dataUrl) {
    return (
      <Card className="overflow-hidden">
        <CardContent className="p-0">
          <img 
            src={dataUrl} 
            alt="Previsualización del presupuesto" 
            className="w-full h-auto"
          />
        </CardContent>
      </Card>
    );
  }
  
  // Mostramos un skeleton mientras se genera
  if (previewOnly && isGenerating) {
    return (
      <Card>
        <CardContent className="p-4">
          <Skeleton className="h-8 w-2/3 mb-4" />
          <Skeleton className="h-4 w-full mb-2" />
          <Skeleton className="h-4 w-full mb-2" />
          <Skeleton className="h-4 w-full mb-4" />
          
          <div className="space-y-2 mt-6">
            <Skeleton className="h-6 w-full" />
            <Skeleton className="h-6 w-full" />
            <Skeleton className="h-6 w-full" />
            <Skeleton className="h-6 w-full" />
            <Skeleton className="h-6 w-full" />
          </div>
          
          <Skeleton className="h-8 w-1/3 mt-4 ml-auto" />
        </CardContent>
      </Card>
    );
  }
  
  // La versión real para renderizar
  return (
    <div 
      ref={previewRef} 
      className="bg-white p-8 shadow-lg max-w-full"
      style={{ 
        maxWidth: previewOnly ? '100%' : '210mm', 
        minHeight: previewOnly ? 'auto' : '297mm',
        display: previewOnly && (isGenerating || dataUrl) ? 'none' : 'block'
      }}
    >
      {/* Encabezado */}
      <div className="flex justify-between items-start mb-8">
        <div className={`flex justify-${logoPosition} w-full`}>
          {organization.logoUrl && (
            <div className="mb-4" style={{ maxWidth: '150px', maxHeight: '80px' }}>
              <img 
                src={organization.logoUrl} 
                alt={`Logo de ${organization.name}`} 
                className="max-w-full max-h-full object-contain"
              />
            </div>
          )}
        </div>
        
        <div className="text-right">
          <h1 className="text-2xl font-bold" style={{ color: primaryColor }}>
            {organization.name}
          </h1>
          {organization.pdfConfig?.showTaxId && organization.taxId && (
            <p className="text-sm text-gray-600">CUIT/RUT: {organization.taxId}</p>
          )}
          {organization.pdfConfig?.showAddress && organization.address && (
            <p className="text-sm text-gray-600">{organization.address}</p>
          )}
          {organization.pdfConfig?.showPhone && organization.phone && (
            <p className="text-sm text-gray-600">{organization.phone}</p>
          )}
          {organization.pdfConfig?.showEmail && organization.email && (
            <p className="text-sm text-gray-600">{organization.email}</p>
          )}
          {organization.pdfConfig?.showWebsite && organization.website && (
            <p className="text-sm text-gray-600">{organization.website}</p>
          )}
        </div>
      </div>
      
      {/* Información del presupuesto */}
      <div className="mb-8">
        <h2 className="text-xl font-bold mb-2" style={{ color: primaryColor }}>
          {budget.name}
        </h2>
        <p className="text-sm mb-1">
          <span className="font-semibold">Proyecto:</span> {project.name}
        </p>
        {budget.description && (
          <p className="text-sm text-gray-600 mt-2">{budget.description}</p>
        )}
        <p className="text-sm text-gray-600 mt-2">
          <span className="font-semibold">Fecha:</span> {new Date().toLocaleDateString('es-AR')}
        </p>
      </div>
      
      {/* Tabla de tareas */}
      <div className="mb-8">
        <table className="w-full border-collapse">
          <thead>
            <tr style={{ backgroundColor: primaryColor }}>
              <th className="py-2 px-4 text-white text-left">Descripción</th>
              <th className="py-2 px-4 text-white text-center">Unidad</th>
              <th className="py-2 px-4 text-white text-center">Cantidad</th>
              <th className="py-2 px-4 text-white text-right">Precio Unitario</th>
              <th className="py-2 px-4 text-white text-right">Subtotal</th>
            </tr>
          </thead>
          <tbody>
            {budgetTasks.map((budgetTask, index) => (
              <tr 
                key={budgetTask.id} 
                className={index % 2 === 0 ? 'bg-gray-50' : 'bg-white'}
              >
                <td className="py-2 px-4 border-b border-gray-200">
                  <p className="font-medium">{budgetTask.task.name}</p>
                  <p className="text-xs text-gray-500 mt-1">{budgetTask.task.category}</p>
                </td>
                <td className="py-2 px-4 border-b border-gray-200 text-center">
                  {budgetTask.task.unit}
                </td>
                <td className="py-2 px-4 border-b border-gray-200 text-center">
                  {budgetTask.quantity}
                </td>
                <td className="py-2 px-4 border-b border-gray-200 text-right">
                  {formatCurrency(budgetTask.task.unitPrice)}
                </td>
                <td className="py-2 px-4 border-b border-gray-200 text-right font-medium">
                  {formatCurrency(budgetTask.quantity * budgetTask.task.unitPrice)}
                </td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr>
              <td colSpan={4} className="py-3 px-4 text-right font-bold">
                TOTAL
              </td>
              <td className="py-3 px-4 text-right font-bold" style={{ color: primaryColor }}>
                {formatCurrency(calculateTotal())}
              </td>
            </tr>
          </tfoot>
        </table>
      </div>
      
      {/* Notas */}
      <div className="mt-8 text-sm text-gray-600">
        <p className="mb-1"><strong>Notas:</strong></p>
        <p>* Los precios pueden variar según disponibilidad y fluctuaciones de mercado.</p>
        <p>* Este presupuesto tiene una validez de 15 días desde su emisión.</p>
        <p>* Los tiempos de ejecución se acordarán según la complejidad del proyecto.</p>
      </div>
      
      {/* Pie de página */}
      <div className="mt-16 pt-4 border-t text-center text-sm text-gray-500">
        <p>Generado desde Archub - Sistema de Gestión de Proyectos de Construcción</p>
      </div>
    </div>
  );
}