import React, { useState } from 'react'
import { Plus, FileText } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { useToast } from '@/hooks/use-toast'

import { supabase } from '@/lib/supabase'
import { useQuery } from '@tanstack/react-query'

interface Props {
  templateId: string
  nameExpression?: string | null
  onBack: () => void
  onFinish: () => void
}

export function TemplateParamsStep({ templateId, nameExpression, onBack, onFinish }: Props) {
  const { toast } = useToast()
  const [selectedParameterId, setSelectedParameterId] = useState<string>('')

  // Fetch template data
  const { data: template, isLoading: templateLoading } = useQuery({
    queryKey: ['task-template', templateId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('task_templates')
        .select('id, name, name_expression')
        .eq('id', templateId)
        .single()
      if (error) throw error
      return data
    },
    enabled: !!templateId
  })

  // Fetch all available parameters
  const { data: allParameters = [], isLoading: parametersLoading } = useQuery({
    queryKey: ['task-parameters-available'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('task_parameters')
        .select('*')
        .order('label')

      if (error) throw error
      return data || []
    }
  })

  // Fetch current template parameters
  const { data: currentTemplateParams = [], isLoading: templateParamsLoading } = useQuery({
    queryKey: ['task-template-parameters', templateId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('task_template_parameters')
        .select(`
          *,
          parameter:task_parameters(id, slug, label, type)
        `)
        .eq('template_id', templateId)
        .order('order_index')

      if (error) throw error
      return data || []
    },
    enabled: !!templateId
  })

  const addParameter = () => {
    console.log('Adding parameter:', selectedParameterId)
    toast({
      title: 'Parámetro agregado',
      description: 'Esta funcionalidad se implementará próximamente.',
    })
  }

  const isLoading = templateLoading || parametersLoading || templateParamsLoading

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-accent"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Add Parameter Card */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Agregar parámetro</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <label className="text-sm font-medium">Seleccionar parámetro</label>
            <Select value={selectedParameterId} onValueChange={setSelectedParameterId}>
              <SelectTrigger>
                <SelectValue placeholder="Buscar parámetro..." />
              </SelectTrigger>
              <SelectContent>
                {allParameters.map(param => (
                  <SelectItem key={param.id} value={param.id}>
                    <div className="flex items-center gap-2">
                      <span>{param.label}</span>
                      <code className="text-xs text-muted-foreground">
                        {param.slug}
                      </code>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <Button 
            onClick={addParameter} 
            disabled={!selectedParameterId}
            className="w-full"
          >
            <Plus className="h-4 w-4 mr-2" />
            Agregar parámetro
          </Button>
        </CardContent>
      </Card>

      {/* Assigned Parameters Card */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Parámetros asignados</CardTitle>
        </CardHeader>
        <CardContent>
          {currentTemplateParams.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <FileText className="h-8 w-8 mx-auto mb-2 opacity-50" />
              <p className="text-sm">No hay parámetros asignados</p>
              <p className="text-xs">Agrega parámetros desde el panel superior</p>
            </div>
          ) : (
            <div className="space-y-2">
              {currentTemplateParams.map((tp) => (
                <div key={tp.id} className="border rounded-lg p-3 bg-background">
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="font-medium text-sm">{tp.parameter?.label}</span>
                      <code className="text-xs text-muted-foreground ml-2">
                        {tp.parameter?.slug}
                      </code>
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {tp.parameter?.type}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}