import React from 'react'
import { Layout } from '@/components/layout/desktop/Layout'
import { Database } from 'lucide-react'

export default function ProjectBasicData() {
  const headerProps = {
    title: "Datos Básicos",
    breadcrumb: [
      { label: "Organización", href: "/organization/dashboard" },
      { label: "Proyecto", href: "/project/dashboard" },
      { label: "Datos Básicos" }
    ]
  }

  return (
    <Layout headerProps={headerProps}>
      <div className="space-y-6">
        {/* Header Section */}
        <div className="space-y-2">
          <h1 className="text-2xl font-bold">Datos Básicos del Proyecto</h1>
          <p className="text-muted-foreground">
            Administra la información fundamental y configuración básica del proyecto
          </p>
        </div>

        {/* Demo Section */}
        <div className="bg-card border rounded-lg p-6">
          <div className="flex items-start gap-4">
            <div className="flex items-center justify-center w-12 h-12 bg-blue-100 rounded-lg">
              <Database className="w-6 h-6 text-blue-600" />
            </div>
            <div className="flex-1">
              <h3 className="text-lg font-semibold mb-2">Configuración de Datos</h3>
              <p className="text-muted-foreground mb-4">
                En esta sección podrás gestionar todos los datos básicos del proyecto, 
                incluyendo información general, configuraciones y parámetros fundamentales.
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-4 border rounded-lg">
                  <h4 className="font-medium mb-2">Información General</h4>
                  <p className="text-sm text-muted-foreground">
                    Nombre, descripción, fechas y detalles básicos del proyecto
                  </p>
                </div>
                <div className="p-4 border rounded-lg">
                  <h4 className="font-medium mb-2">Configuraciones</h4>
                  <p className="text-sm text-muted-foreground">
                    Parámetros y preferencias específicas del proyecto
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  )
}