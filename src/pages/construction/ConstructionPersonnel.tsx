import { Layout } from '@/components/layout/desktop/Layout'
import { useMemo, useEffect, useState } from 'react'
import { useCurrentUser } from '@/hooks/use-current-user'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { useNavigationStore } from '@/stores/navigationStore'
import CustomGradebook from '@/components/ui-custom/CustomGradebook'
import { EmptyState } from '@/components/ui-custom/EmptyState'
import { useGlobalModalStore } from '@/components/modal/form/useGlobalModalStore'
import { Users, Plus, UserCheck } from 'lucide-react'
import { format } from 'date-fns'
import { Table } from "@/components/ui-custom/Table";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Edit, Trash2 } from "lucide-react";
import { InsuranceTab } from '@/components/personnel/insurance/InsuranceTab';

// Hook to fetch attendance data from new attendees table
function useAttendanceData(projectId: string | undefined, organizationId: string | undefined) {
  return useQuery({
    queryKey: ['construction-attendance', projectId, organizationId],
    queryFn: async () => {
      if (!supabase || !projectId || !organizationId) return []



      // Query the attendees table with personnel relationship
      const { data: attendanceData, error } = await supabase
        .from('attendees')
        .select(`
          *,
          personnel:project_personnel(
            id,
            notes,
            contact:contacts(
              id,
              first_name,
              last_name,
              organization_id,
              contact_type_links(
                contact_type:contact_types(
                  id,
                  name
                )
              )
            )
          )
        `)
        .eq('project_id', projectId)

      if (error) {

        return []
      }

      // Filter to ensure contacts belong to the same organization
      const filteredData = (attendanceData || []).filter(item => 
        item.personnel?.contact?.organization_id === organizationId
      )


      
      return filteredData
    },
    enabled: !!supabase && !!projectId && !!organizationId
  })
}



// Transform attendance data for gradebook display
function transformAttendanceData(attendanceData: any[]) {
  if (!attendanceData || attendanceData.length === 0) return { workers: [], attendance: [] }

  // Get unique workers from personnel data
  const workersMap = new Map()
  attendanceData.forEach(attendance => {
    if (attendance.personnel?.contact) {
      const contact = attendance.personnel.contact
      const workerId = contact.id
      const workerName = `${contact.first_name || ''} ${contact.last_name || ''}`.trim()
      const contactTypeName = contact.contact_type_links?.[0]?.contact_type?.name || 'Sin tipo'
      const contactTypeId = contact.contact_type_links?.[0]?.contact_type?.id
      
      workersMap.set(workerId, {
        id: workerId,
        name: workerName || 'Sin nombre',
        contactType: contactTypeName,
        contactTypeId: contactTypeId
      })
    }
  })

  const workers = Array.from(workersMap.values())

  // Create attendance records array for CustomGradebook
  const attendance: any[] = []

  attendanceData.forEach(attendanceRecord => {
    if (attendanceRecord.personnel?.contact) {
      const workerId = attendanceRecord.personnel.contact.id
      const logDate = new Date(attendanceRecord.created_at)
      const day = format(logDate, 'yyyy-MM-dd') // Use full date format for matching
      
      // Map attendance_type to gradebook format
      let status: 'full' | 'half' = 'full'
      if (attendanceRecord.attendance_type === 'half') {
        status = 'half'
      }

      attendance.push({
        workerId,
        day,
        status
      })
    }
  })

  return { workers, attendance }
}

export default function ConstructionPersonnel() {
  const { openModal } = useGlobalModalStore()
  const { data: userData } = useCurrentUser()
  const queryClient = useQueryClient()

  // Function to handle personnel deletion
  const handleDeletePersonnel = async (personnelId: string) => {
    try {
      const { error } = await supabase
        .from('project_personnel')
        .delete()
        .eq('id', personnelId)

      if (error) {
        console.error('Error deleting personnel:', error)
        return
      }

      // Invalidate and refetch the personnel and attendance data
      queryClient.invalidateQueries({ queryKey: ['project-personnel', userData?.preferences?.last_project_id] })
      queryClient.invalidateQueries({ queryKey: ['attendance-data'] })
    } catch (error) {
      console.error('Error deleting personnel:', error)
    }
  }
  const { data: attendanceData = [], isLoading } = useAttendanceData(
    userData?.preferences?.last_project_id,
    userData?.organization?.id
  )

  // Fetch project personnel
  const { data: personnelData = [], isLoading: isPersonnelLoading } = useQuery({
    queryKey: ['project-personnel', userData?.preferences?.last_project_id],
    queryFn: async () => {
      if (!userData?.preferences?.last_project_id) return []
      
      const { data, error } = await supabase
        .from('project_personnel')
        .select(`
          id,
          notes,
          created_at,
          contact:contacts(
            id,
            first_name,
            last_name
          )
        `)
        .eq('project_id', userData.preferences.last_project_id)
        .order('created_at', { ascending: false })

      if (error) throw error
      return data
    },
    enabled: !!userData?.preferences?.last_project_id
  })
  const { setSidebarContext } = useNavigationStore()
  const [activeTab, setActiveTab] = useState('active')

  // Check if there's personnel assigned to determine if other tabs should be enabled
  const hasPersonnel = personnelData.length > 0

  // Set sidebar context on mount
  useEffect(() => {
    setSidebarContext('construction')
  }, [])

  // Force active tab to be 'active' if no personnel and currently on disabled tab
  useEffect(() => {
    if (!hasPersonnel && (activeTab === 'attendance' || activeTab === 'insurance')) {
      setActiveTab('active')
    }
  }, [hasPersonnel, activeTab])

  const { workers, attendance } = useMemo(() => {
    return transformAttendanceData(attendanceData)
  }, [attendanceData])

  // Handle editing attendance - opens modal with existing data
  const handleEditAttendance = (workerId: string, date: Date, existingAttendance?: any) => {
    // Find the worker details
    const worker = workers.find(w => w.id === workerId);
    if (!worker) return;

    // Open the attendance modal with editing data
    openModal('attendance', {
      isEditing: true,
      editingData: {
        personnelId: workerId, // Cambiar de contactId a personnelId
        contactName: worker.name,
        attendanceDate: date,
        existingRecord: existingAttendance
      }
    });
  }
  
  const headerProps = {
    icon: Users,
    title: "Personal",
    breadcrumb: [
      { name: "Construcción", href: "/construction/dashboard" },
      { name: "Personal", href: "/construction/personnel" }
    ],
    tabs: [
      {
        id: 'active',
        label: 'Activos',
        isActive: activeTab === 'active'
      },
      {
        id: 'attendance',
        label: 'Asistencia',
        isActive: activeTab === 'attendance',
        disabled: !hasPersonnel
      },
      {
        id: 'insurance',
        label: 'Seguros',
        isActive: activeTab === 'insurance',
        disabled: !hasPersonnel
      }
    ],
    onTabChange: (tabId: string) => {
      // Only allow tab change if tab is not disabled
      if (tabId === 'attendance' || tabId === 'insurance') {
        if (!hasPersonnel) {
          return // Don't change tab if no personnel
        }
      }
      setActiveTab(tabId)
    },
    actionButton: activeTab === 'attendance' ? {
      label: 'Registrar Asistencia',
      icon: Plus,
      onClick: () => openModal('attendance', {})
    } : activeTab === 'active' ? {
      label: 'Agregar Personal',
      icon: Plus,
      onClick: () => openModal('personnel')
    } : activeTab === 'insurance' ? {
      label: 'Nuevo Seguro',
      icon: Plus,
      onClick: () => openModal('insurance', { 
        mode: 'create', 
        projectId: userData?.preferences?.last_project_id 
      })
    } : undefined
  }

  if (isLoading) {
    return (
      <Layout headerProps={headerProps}>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 dark:border-white"></div>
        </div>
      </Layout>
    )
  }

  return (
    <Layout headerProps={headerProps} wide>
      <div className="space-y-6">
        {activeTab === 'active' && (
          <>
            {isPersonnelLoading ? (
              <div className="flex items-center justify-center h-32">
                <div className="text-muted-foreground">Cargando personal...</div>
              </div>
            ) : personnelData.length === 0 ? (
              <EmptyState
                icon={<Users className="h-8 w-8" />}
                title="Sin personal asignado"
                description="Vincula contactos de tu organización como mano de obra del proyecto para gestionar asistencias y seguimiento de personal."
                action={
                  <Button onClick={() => openModal('personnel')}>
                    Agregar Personal
                  </Button>
                }
              />
            ) : (
              <Table
                data={personnelData}
                columns={[
                  {
                    key: "contact",
                    label: "Personal",
                    width: "50%",
                    render: (record: any) => {
                      const contact = record.contact;
                      if (!contact) {
                        return <span className="text-muted-foreground">Sin datos</span>;
                      }
                      return (
                        <div className="flex items-center gap-3">
                          <Avatar className="h-8 w-8">
                            <AvatarFallback className="text-xs">
                              {contact.first_name?.charAt(0) || ''}{contact.last_name?.charAt(0) || ''}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <p className="font-medium">
                              {contact.first_name || ''} {contact.last_name || ''}
                            </p>
                          </div>
                        </div>
                      );
                    }
                  },
                  {
                    key: "notes",
                    label: "Notas", 
                    width: "33%",
                    render: (record: any) => (
                      <span className="text-sm text-muted-foreground">
                        {record.notes || 'Sin notas'}
                      </span>
                    )
                  },
                  {
                    key: "actions",
                    label: "Acciones",
                    width: "17%",
                    sortable: false,
                    render: (record: any) => (
                      <div className="flex items-center gap-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => openModal('personnel', { personnel: record })}
                          className="h-8 w-8 p-0"
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => openModal('delete-confirmation', {
                            title: 'Eliminar Personal',
                            message: `¿Estás seguro de que deseas eliminar a ${record.contact?.first_name} ${record.contact?.last_name} del proyecto?`,
                            onConfirm: () => handleDeletePersonnel(record.id)
                          })}
                          className="h-8 w-8 p-0 text-destructive hover:text-destructive"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    )
                  }
                ]}
                getItemId={(record: any) => record.id}
              />
            )}
          </>
        )}

        {activeTab === 'attendance' && (
          <>
            {workers.length > 0 ? (
              <CustomGradebook 
                workers={workers}
                attendance={attendance}
                onEditAttendance={handleEditAttendance}
              />
            ) : (
              <EmptyState
                icon={<UserCheck className="h-12 w-12" />}
                title="Sin registros de asistencia"
                description="No hay registros de asistencia para este proyecto. El personal aparecerá aquí cuando se registren entradas de bitácora con asistencia."
                action={
                  <Button onClick={() => openModal('attendance', {})}>
                    Registrar Asistencia
                  </Button>
                }
              />
            )}
          </>
        )}

        {activeTab === 'insurance' && <InsuranceTab />}
      </div>
    </Layout>
  )
}