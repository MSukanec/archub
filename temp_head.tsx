import { Layout } from '@/components/layout/desktop/Layout'
import { ActionBarDesktop } from '@/components/layout/desktop/ActionBarDesktop'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion'
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'


import { useState, useEffect, Fragment } from 'react'
import { useCurrentUser } from '@/hooks/use-current-user'
import { Calculator, Plus, Trash2, Building2, Edit, FileText, BarChart3, Settings, CheckSquare, Filter, Target } from 'lucide-react'
import { useNavigationStore } from '@/stores/navigationStore'
// Removed CustomTable import as we now use BudgetTable
import { EmptyState } from '@/components/ui-custom/EmptyState'
import { FeatureIntroduction } from '@/components/ui-custom/FeatureIntroduction'
import { Table } from '@/components/ui-custom/Table'
import { useGlobalModalStore } from '@/components/modal/form/useGlobalModalStore'

import { useBudgets } from '@/hooks/use-budgets'
import { useBudgetTasks } from '@/hooks/use-budget-tasks'

import { useToast } from '@/hooks/use-toast'
import { useMutation, useQueryClient, useQuery } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { BudgetTaskCard } from '@/components/cards/BudgetTaskCard'
import { useUnits } from '@/hooks/use-units'
import { useDeleteConfirmation } from '@/hooks/useDeleteConfirmation'

import { Input } from '@/components/ui/input'

import { validateUserDataForDatabaseOperation, logDatabaseOperation } from '@/utils/databaseSafety'


// Hook para obtener valores de parámetros con expression_template
const useTaskParameterValues = () => {
  return useQuery({
    queryKey: ['task-parameter-values'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('task_parameter_values')
        .select(`
          name, 
          label,
          task_parameters!inner(expression_template)
        `);
      
      if (error) throw error;
      
      // Flatten the data structure to include expression_template directly
      return data?.map(item => ({
        name: item.name,
        label: item.label,
        expression_template: item.task_parameters?.expression_template || null
      })) || [];
    }
  });
};

// Función para procesar el display_name con expression_templates (igual que en el modal)
async function processDisplayName(displayName: string, paramValues: any): Promise<string> {
  if (!displayName || !paramValues || !supabase) return displayName;
  
  let processed = displayName;
  
  // Obtener los valores reales de los parámetros
  const paramValueIds = Object.values(paramValues);
  if (paramValueIds.length === 0) return displayName;
  
  const { data: parameterValues, error } = await supabase
    .from('task_parameter_values')
    .select(`
      name, 
      label,
      parameter_id,
      task_parameters!inner(expression_template)
    `)
    .in('name', paramValueIds);
  
  if (error) {
    console.error("Error fetching parameter values:", error);
    return displayName;
  }
  
  // Reemplazar placeholders usando expression_template o label
  Object.keys(paramValues).forEach(key => {
    const placeholder = `{{${key}}}`;
    const paramValueId = paramValues[key];
    
    // Buscar el valor correspondiente
    const paramValue = parameterValues?.find(pv => pv.name === paramValueId);
    
    if (paramValue) {
      // Usar expression_template si existe, sino usar label
      let replacement = paramValue.task_parameters?.expression_template || paramValue.label || '';
      
      // Si el replacement contiene {value}, reemplazarlo con el label
      if (replacement && replacement.includes('{value}')) {
        replacement = replacement.replace(/{value}/g, paramValue.label || '');
      }
      
      processed = processed.replace(new RegExp(placeholder, 'g'), replacement);
    }
  });
  
  // Clean up multiple spaces and trim the final result
  return processed.replace(/\s+/g, ' ').trim();
}

// Función para generar el nombre completo de la tarea usando los datos ya procesados
function generateTaskDisplayName(task: any, parameterValues: any[] = []): string {
  if (!task) return 'Sin nombre';
  
  // Usar display_name que ya fue procesado por el hook useBudgetTasks
  return task.display_name || task.name || 'Sin nombre';
}

interface Budget {
  id: string
  name: string
  description?: string
  project_id: string
  organization_id: string
  status: string
  created_at: string
  created_by: string
  group_tasks_by_rubro?: boolean
}

interface BudgetTask {
  id: string
  budget_id: string
  task_id: string
  quantity: number
  start_date: string | null
  end_date: string | null
  organization_id: string
  task: {
    id: string
    code: string
    name: string
    template_id: string | null
    param_values: any
    is_public: boolean
    organization_id: string
    unit_id: string | null
  }
}



export default function ConstructionBudgets() {
