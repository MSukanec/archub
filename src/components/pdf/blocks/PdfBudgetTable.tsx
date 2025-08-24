import React from 'react';
import { View, Text, StyleSheet } from '@react-pdf/renderer';
import { PdfBlockProps } from '../types';

const styles = StyleSheet.create({
  table: {
    marginBottom: 20,
  },
  tableHeader: {
    flexDirection: 'row',
    backgroundColor: '#f0f0f0',
    borderWidth: 1,
    borderColor: '#000',
  },
  tableRow: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#ccc',
    borderLeftWidth: 1,
    borderRightWidth: 1,
    borderColor: '#000',
  },
  tableCell: {
    flex: 1,
    padding: 8,
    fontSize: 10,
  },
  tableCellPhase: {
    flex: 1.5,
    padding: 8,
    fontSize: 10,
  },
  tableCellRubro: {
    flex: 1,
    padding: 8,
    fontSize: 10,
  },
  tableCellTask: {
    flex: 2,
    padding: 8,
    fontSize: 10,
  },
  tableCellUnit: {
    flex: 0.8,
    padding: 8,
    fontSize: 10,
    textAlign: 'center',
  },
  tableCellQuantity: {
    flex: 0.8,
    padding: 8,
    fontSize: 10,
    textAlign: 'right',
  },
  tableCellCost: {
    flex: 1.2,
    padding: 8,
    fontSize: 10,
    textAlign: 'right',
  },
  tableCellSubtotal: {
    flex: 1.2,
    padding: 8,
    fontSize: 10,
    textAlign: 'right',
  },
  headerText: {
    fontWeight: 'bold',
    fontSize: 10,
  },
});

interface BudgetData {
  tasks: any[];
}

export const PdfBudgetTable: React.FC<PdfBlockProps<BudgetData>> = ({ data, config }) => {
  const tasks = data?.tasks || [];
  
  // Extract table configuration with defaults
  const tableConfig = {
    titleSize: config?.titleSize || 12,
    bodySize: config?.bodySize || 10,
    showTableBorder: config?.showTableBorder !== false,
    showRowDividers: config?.showRowDividers !== false,
    groupBy: config?.groupBy || 'none'
  };
  
  console.log('🔧 PdfBudgetTable config:', { config, tableConfig });

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-AR', {
      style: 'currency',
      currency: 'ARS',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  };

  const calculateTaskCost = (task: any) => {
    // Lógica simple para calcular el costo - puedes ajustar según tu estructura de datos
    const quantity = task.quantity || 0;
    const unitCost = task.unit_cost || 0;
    return quantity * unitCost;
  };

  // Create dynamic styles based on configuration
  const dynamicStyles = {
    tableHeader: {
      ...styles.tableHeader,
      borderWidth: tableConfig.showTableBorder ? 1 : undefined,
      borderBottomWidth: tableConfig.showRowDividers ? 1 : undefined,
      borderColor: tableConfig.showTableBorder ? '#000' : undefined,
    },
    tableRow: {
      ...styles.tableRow,
      borderLeftWidth: tableConfig.showTableBorder ? 1 : undefined,
      borderRightWidth: tableConfig.showTableBorder ? 1 : undefined,
      borderBottomWidth: tableConfig.showRowDividers ? 1 : undefined,
      borderColor: tableConfig.showTableBorder || tableConfig.showRowDividers ? '#000' : undefined,
    },
    headerText: {
      fontWeight: 'bold',
      fontSize: tableConfig.titleSize,
    },
    bodyText: {
      fontSize: tableConfig.bodySize,
    }
  };
  
  // Determine which columns to show based on groupBy setting
  const showPhase = tableConfig.groupBy !== 'fase' && tableConfig.groupBy !== 'fases-y-rubros';
  const showRubro = tableConfig.groupBy !== 'rubro' && tableConfig.groupBy !== 'fases-y-rubros';

  return (
    <View style={styles.table}>
      {/* Header */}
      <View style={dynamicStyles.tableHeader}>
        {showPhase && <Text style={[styles.tableCellPhase, dynamicStyles.headerText]}>Fase</Text>}
        {showRubro && <Text style={[styles.tableCellRubro, dynamicStyles.headerText]}>Rubro</Text>}
        <Text style={[styles.tableCellTask, dynamicStyles.headerText]}>Tarea</Text>
        <Text style={[styles.tableCellUnit, dynamicStyles.headerText]}>Unidad</Text>
        <Text style={[styles.tableCellQuantity, dynamicStyles.headerText]}>Cantidad</Text>
        <Text style={[styles.tableCellCost, dynamicStyles.headerText]}>Costo Unitario</Text>
        <Text style={[styles.tableCellSubtotal, dynamicStyles.headerText]}>Subtotal</Text>
      </View>

      {/* Rows */}
      {tasks.map((task, index) => {
        const customName = task.custom_name || task.task?.display_name;
        const taskName = customName && !customName.match(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i) 
          ? customName 
          : task.task?.display_name || 'Sin nombre';
        
        const unitCost = task.unit_cost || 0;
        const quantity = task.quantity || 0;
        const subtotal = calculateTaskCost(task);

        return (
          <View key={index} style={dynamicStyles.tableRow}>
            {showPhase && <Text style={[styles.tableCellPhase, dynamicStyles.bodyText]}>{task.phase_name || 'Sin fase'}</Text>}
            {showRubro && <Text style={[styles.tableCellRubro, dynamicStyles.bodyText]}>{task.category_name || 'Sin rubro'}</Text>}
            <Text style={[styles.tableCellTask, dynamicStyles.bodyText]}>{taskName}</Text>
            <Text style={[styles.tableCellUnit, dynamicStyles.bodyText]}>{task.unit || '-'}</Text>
            <Text style={[styles.tableCellQuantity, dynamicStyles.bodyText]}>{quantity.toFixed(2)}</Text>
            <Text style={[styles.tableCellCost, dynamicStyles.bodyText]}>{formatCurrency(unitCost)}</Text>
            <Text style={[styles.tableCellSubtotal, dynamicStyles.bodyText]}>{formatCurrency(subtotal)}</Text>
          </View>
        );
      })}
    </View>
  );
};