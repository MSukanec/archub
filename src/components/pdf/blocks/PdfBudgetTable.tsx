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

  return (
    <View style={styles.table}>
      {/* Header */}
      <View style={styles.tableHeader}>
        <Text style={[styles.tableCellPhase, styles.headerText]}>Fase</Text>
        <Text style={[styles.tableCellRubro, styles.headerText]}>Rubro</Text>
        <Text style={[styles.tableCellTask, styles.headerText]}>Tarea</Text>
        <Text style={[styles.tableCellUnit, styles.headerText]}>Unidad</Text>
        <Text style={[styles.tableCellQuantity, styles.headerText]}>Cantidad</Text>
        <Text style={[styles.tableCellCost, styles.headerText]}>Costo Unitario</Text>
        <Text style={[styles.tableCellSubtotal, styles.headerText]}>Subtotal</Text>
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
          <View key={index} style={styles.tableRow}>
            <Text style={styles.tableCellPhase}>{task.phase_name || 'Sin fase'}</Text>
            <Text style={styles.tableCellRubro}>{task.category_name || 'Sin rubro'}</Text>
            <Text style={styles.tableCellTask}>{taskName}</Text>
            <Text style={styles.tableCellUnit}>{task.unit || '-'}</Text>
            <Text style={styles.tableCellQuantity}>{quantity.toFixed(2)}</Text>
            <Text style={styles.tableCellCost}>{formatCurrency(unitCost)}</Text>
            <Text style={styles.tableCellSubtotal}>{formatCurrency(subtotal)}</Text>
          </View>
        );
      })}
    </View>
  );
};