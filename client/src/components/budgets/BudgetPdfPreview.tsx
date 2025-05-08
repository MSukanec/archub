import { useEffect, useState } from "react";
import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
  PDFViewer,
  pdf,
  Image,
  Font,
} from "@react-pdf/renderer";
import { format } from "date-fns";
import { es } from "date-fns/locale";

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

// Registrar fuentes (opcional)
Font.register({
  family: "Roboto",
  fonts: [
    { src: "https://fonts.gstatic.com/s/roboto/v29/KFOmCnqEu92Fr1Mu4mxP.ttf", fontWeight: 400 },
    { src: "https://fonts.gstatic.com/s/roboto/v29/KFOlCnqEu92Fr1MmWUlfBBc9.ttf", fontWeight: 700 },
  ],
});

export function BudgetPdfPreview({ 
  organization, 
  project, 
  budget, 
  budgetTasks,
  previewOnly = false,
  onPreviewGenerated
}: BudgetPdfPreviewProps) {
  const [isMounted, setIsMounted] = useState(false);
  
  // Configuración del PDF
  const pdfConfig = organization.pdfConfig || {
    logoPosition: "left",
    showAddress: true,
    showPhone: true,
    showEmail: true,
    showWebsite: true,
    showTaxId: true,
    primaryColor: "#92c900",
    secondaryColor: "#f0f0f0"
  };
  
  // Calcular el total del presupuesto
  const total = budgetTasks.reduce((acc, budgetTask) => {
    return acc + (budgetTask.quantity * budgetTask.task.unitPrice);
  }, 0);
  
  // Agrupar tareas por categoría
  const tasksByCategory = budgetTasks.reduce((acc, budgetTask) => {
    const category = budgetTask.task.category || "Sin categoría";
    
    if (!acc[category]) {
      acc[category] = [];
    }
    
    acc[category].push(budgetTask);
    return acc;
  }, {} as Record<string, BudgetTask[]>);
  
  // Crear estilos para el PDF
  const styles = StyleSheet.create({
    page: {
      flexDirection: 'column',
      padding: 20,
      fontFamily: "Roboto",
      fontSize: 10,
    },
    header: {
      flexDirection: 'row',
      marginBottom: 20,
      alignItems: 'center',
      justifyContent: 'space-between',
    },
    headerCenter: {
      flexDirection: 'column',
      marginBottom: 20,
      alignItems: 'center',
    },
    headerLeft: {
      flexDirection: 'row',
      marginBottom: 20,
      alignItems: 'center',
    },
    headerRight: {
      flexDirection: 'row-reverse',
      marginBottom: 20,
      alignItems: 'center',
    },
    logo: {
      width: 80,
      height: 80,
      marginRight: 10,
      objectFit: 'contain',
    },
    logoCenter: {
      width: 100,
      height: 100,
      marginBottom: 10,
      objectFit: 'contain',
    },
    orgInfo: {
      flex: 1,
      flexDirection: 'column',
    },
    orgName: {
      fontSize: 18,
      fontWeight: 'bold',
      marginBottom: 4,
    },
    orgDetails: {
      fontSize: 10,
      marginBottom: 2,
    },
    projectInfo: {
      marginTop: 10,
      marginBottom: 20,
      padding: 10,
      backgroundColor: pdfConfig.secondaryColor,
      borderRadius: 4,
    },
    projectTitle: {
      fontSize: 12,
      fontWeight: 'bold',
    },
    budgetTitle: {
      fontSize: 16,
      fontWeight: 'bold',
      marginBottom: 4,
      color: pdfConfig.primaryColor,
    },
    section: {
      marginBottom: 10,
    },
    categoryHeader: {
      fontSize: 14,
      fontWeight: 'bold',
      backgroundColor: pdfConfig.primaryColor,
      padding: 6,
      color: 'white',
      marginBottom: 6,
      borderRadius: 4,
    },
    table: {
      display: 'flex',
      width: 'auto',
      borderStyle: 'solid',
      borderWidth: 1,
      borderColor: '#bfbfbf',
      borderRightWidth: 0,
      borderBottomWidth: 0,
    },
    tableRow: {
      margin: 'auto',
      flexDirection: 'row',
    },
    tableRowHeader: {
      margin: 'auto',
      flexDirection: 'row',
      backgroundColor: pdfConfig.secondaryColor,
      borderBottomColor: '#bfbfbf',
      borderBottomWidth: 1,
    },
    tableColHeader: {
      width: '30%',
      borderStyle: 'solid',
      borderColor: '#bfbfbf',
      borderWidth: 1,
      borderLeftWidth: 0,
      borderTopWidth: 0,
      padding: 5,
      fontWeight: 'bold',
    },
    tableNumColHeader: {
      width: '15%',
      borderStyle: 'solid',
      borderColor: '#bfbfbf',
      borderWidth: 1,
      borderLeftWidth: 0,
      borderTopWidth: 0,
      padding: 5,
      fontWeight: 'bold',
      textAlign: 'right',
    },
    tableCol: {
      width: '30%',
      borderStyle: 'solid',
      borderColor: '#bfbfbf',
      borderWidth: 1,
      borderLeftWidth: 0,
      borderTopWidth: 0,
      padding: 5,
    },
    tableNumCol: {
      width: '15%',
      borderStyle: 'solid',
      borderColor: '#bfbfbf',
      borderWidth: 1,
      borderLeftWidth: 0,
      borderTopWidth: 0,
      padding: 5,
      textAlign: 'right',
    },
    tableTotalRow: {
      margin: 'auto',
      flexDirection: 'row',
      backgroundColor: pdfConfig.secondaryColor,
      fontWeight: 'bold',
    },
    footer: {
      marginTop: 20,
      padding: 10,
      fontSize: 8,
      textAlign: 'center',
      color: '#666',
    },
    dateText: {
      fontSize: 10,
      marginBottom: 10,
      textAlign: 'right',
    },
  });
  
  // Componente PDF
  const BudgetPdf = (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* Encabezado de la organización */}
        {pdfConfig.logoPosition === 'center' ? (
          <View style={styles.headerCenter}>
            {organization.logoUrl && (
              <Image src={organization.logoUrl} style={styles.logoCenter} />
            )}
            <Text style={styles.orgName}>{organization.name}</Text>
            {organization.description && (
              <Text style={styles.orgDetails}>{organization.description}</Text>
            )}
            {pdfConfig.showAddress && organization.address && (
              <Text style={styles.orgDetails}>{organization.address}</Text>
            )}
            <View style={{ flexDirection: 'row', justifyContent: 'center', flexWrap: 'wrap' }}>
              {pdfConfig.showPhone && organization.phone && (
                <Text style={[styles.orgDetails, { marginRight: 10 }]}>
                  Tel: {organization.phone}
                </Text>
              )}
              {pdfConfig.showEmail && organization.email && (
                <Text style={[styles.orgDetails, { marginRight: 10 }]}>
                  Email: {organization.email}
                </Text>
              )}
              {pdfConfig.showWebsite && organization.website && (
                <Text style={styles.orgDetails}>Web: {organization.website}</Text>
              )}
            </View>
            {pdfConfig.showTaxId && organization.taxId && (
              <Text style={styles.orgDetails}>RIF/NIT: {organization.taxId}</Text>
            )}
          </View>
        ) : (
          <View style={pdfConfig.logoPosition === 'left' ? styles.headerLeft : styles.headerRight}>
            {organization.logoUrl && (
              <Image src={organization.logoUrl} style={styles.logo} />
            )}
            <View style={styles.orgInfo}>
              <Text style={styles.orgName}>{organization.name}</Text>
              {organization.description && (
                <Text style={styles.orgDetails}>{organization.description}</Text>
              )}
              {pdfConfig.showAddress && organization.address && (
                <Text style={styles.orgDetails}>{organization.address}</Text>
              )}
              {pdfConfig.showPhone && organization.phone && (
                <Text style={styles.orgDetails}>Tel: {organization.phone}</Text>
              )}
              {pdfConfig.showEmail && organization.email && (
                <Text style={styles.orgDetails}>Email: {organization.email}</Text>
              )}
              {pdfConfig.showWebsite && organization.website && (
                <Text style={styles.orgDetails}>Web: {organization.website}</Text>
              )}
              {pdfConfig.showTaxId && organization.taxId && (
                <Text style={styles.orgDetails}>RIF/NIT: {organization.taxId}</Text>
              )}
            </View>
          </View>
        )}
        
        {/* Fecha */}
        <View>
          <Text style={styles.dateText}>
            Fecha: {format(new Date(), "d 'de' MMMM 'de' yyyy", { locale: es })}
          </Text>
        </View>
        
        {/* Información del proyecto */}
        <View style={styles.projectInfo}>
          <Text style={styles.projectTitle}>Proyecto: {project.name}</Text>
          {project.description && (
            <Text style={styles.orgDetails}>{project.description}</Text>
          )}
        </View>
        
        {/* Título del presupuesto */}
        <View style={styles.section}>
          <Text style={styles.budgetTitle}>{budget.name}</Text>
          {budget.description && (
            <Text style={styles.orgDetails}>{budget.description}</Text>
          )}
        </View>
        
        {/* Tareas agrupadas por categoría */}
        {Object.entries(tasksByCategory).map(([category, tasks]) => (
          <View style={styles.section} key={category}>
            <Text style={styles.categoryHeader}>{category}</Text>
            <View style={styles.table}>
              {/* Encabezados de tabla */}
              <View style={styles.tableRowHeader}>
                <View style={styles.tableColHeader}>
                  <Text>Descripción</Text>
                </View>
                <View style={styles.tableNumColHeader}>
                  <Text>Unidad</Text>
                </View>
                <View style={styles.tableNumColHeader}>
                  <Text>Cantidad</Text>
                </View>
                <View style={styles.tableNumColHeader}>
                  <Text>Precio Unit.</Text>
                </View>
                <View style={styles.tableNumColHeader}>
                  <Text>Total</Text>
                </View>
              </View>
              
              {/* Filas de tareas */}
              {tasks.map((budgetTask) => {
                const { task, quantity } = budgetTask;
                const taskTotal = quantity * task.unitPrice;
                
                return (
                  <View style={styles.tableRow} key={budgetTask.id}>
                    <View style={styles.tableCol}>
                      <Text>{task.name}</Text>
                    </View>
                    <View style={styles.tableNumCol}>
                      <Text>{task.unit}</Text>
                    </View>
                    <View style={styles.tableNumCol}>
                      <Text>{quantity}</Text>
                    </View>
                    <View style={styles.tableNumCol}>
                      <Text>{task.unitPrice.toFixed(2)}</Text>
                    </View>
                    <View style={styles.tableNumCol}>
                      <Text>{taskTotal.toFixed(2)}</Text>
                    </View>
                  </View>
                );
              })}
              
              {/* Total de la categoría */}
              <View style={styles.tableTotalRow}>
                <View 
                  style={{
                    ...styles.tableCol,
                    width: '60%',
                    borderRightWidth: 0,
                  }}
                >
                  <Text>Subtotal {category}</Text>
                </View>
                <View 
                  style={{
                    ...styles.tableNumCol,
                    width: '40%',
                  }}
                >
                  <Text>
                    {tasks.reduce((acc, bt) => acc + (bt.quantity * bt.task.unitPrice), 0).toFixed(2)}
                  </Text>
                </View>
              </View>
            </View>
          </View>
        ))}
        
        {/* Total general */}
        <View style={{ marginTop: 20 }}>
          <View style={styles.table}>
            <View style={styles.tableTotalRow}>
              <View 
                style={{
                  ...styles.tableCol,
                  width: '60%',
                  borderRightWidth: 0,
                }}
              >
                <Text>TOTAL GENERAL</Text>
              </View>
              <View 
                style={{
                  ...styles.tableNumCol,
                  width: '40%',
                }}
              >
                <Text>{total.toFixed(2)}</Text>
              </View>
            </View>
          </View>
        </View>
        
        {/* Pie de página */}
        <View style={styles.footer} fixed>
          <Text>
            Documento generado automáticamente por ArchHub
          </Text>
        </View>
      </Page>
    </Document>
  );
  
  // Generar una vista previa para el componente que lo requiera
  useEffect(() => {
    if (onPreviewGenerated && !previewOnly) {
      // Usar una variable para controlar si ya se ejecutó
      let isGenerating = false;
      
      const generatePreview = async () => {
        if (isGenerating) return;
        isGenerating = true;
        
        try {
          const blob = await pdf(BudgetPdf).toBlob();
          const dataUrl = URL.createObjectURL(blob);
          onPreviewGenerated(dataUrl);
          
          // Limpiar la URL después de usarla
          setTimeout(() => {
            URL.revokeObjectURL(dataUrl);
          }, 100);
        } catch (error) {
          console.error('Error generando vista previa del PDF:', error);
        }
      };
      
      generatePreview();
      
      // Limpiar efecto
      return () => {
        isGenerating = true;
      };
    }
  }, []);
  
  // Efecto para manejar el montaje del componente
  useEffect(() => {
    setIsMounted(true);
    return () => setIsMounted(false);
  }, []);
  
  if (!isMounted || typeof window === "undefined") {
    return <div className="p-4 text-center">Cargando vista previa...</div>;
  }
  
  return previewOnly ? (
    <div className="border rounded-lg overflow-hidden">
      <PDFViewer width="100%" height={500} className="w-full">
        {BudgetPdf}
      </PDFViewer>
    </div>
  ) : (
    <PDFViewer width="100%" height={600} className="w-full">
      {BudgetPdf}
    </PDFViewer>
  );
}