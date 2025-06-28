import React from 'react'
import { Button } from '@/components/ui/button'
import { Download } from 'lucide-react'

interface Worker {
  id: string
  name: string
}

interface AttendanceRecord {
  workerId: string
  day: string
  status: 'full' | 'half'
}

interface CustomGradebookProps {
  workers?: Worker[]
  days?: string[]
  attendance?: AttendanceRecord[]
  onExportAttendance?: () => void
}

const CustomGradebook: React.FC<CustomGradebookProps> = ({
  workers = [
    { id: "1", name: "Carlos García" },
    { id: "2", name: "Mónica Ruiz" },
    { id: "3", name: "Pedro Díaz" },
  ],
  days = Array.from({ length: 30 }, (_, i) => (i + 1).toString().padStart(2, "0")),
  attendance = [
    { workerId: "1", day: "01", status: "full" },
    { workerId: "1", day: "02", status: "half" },
    { workerId: "1", day: "05", status: "full" },
    { workerId: "1", day: "08", status: "half" },
    { workerId: "1", day: "12", status: "full" },
    { workerId: "2", day: "01", status: "full" },
    { workerId: "2", day: "03", status: "half" },
    { workerId: "2", day: "06", status: "full" },
    { workerId: "2", day: "10", status: "full" },
    { workerId: "2", day: "15", status: "half" },
    { workerId: "3", day: "02", status: "half" },
    { workerId: "3", day: "03", status: "full" },
    { workerId: "3", day: "07", status: "full" },
    { workerId: "3", day: "11", status: "half" },
    { workerId: "3", day: "18", status: "full" },
  ],
  onExportAttendance
}) => {
  // Helper function to get attendance status for a specific worker and day
  const getAttendance = (workerId: string, day: string): 'full' | 'half' | null => {
    const record = attendance.find(a => a.workerId === workerId && a.day === day)
    return record ? record.status : null
  }

  // Render attendance cell based on status
  const renderAttendanceCell = (status: 'full' | 'half' | null) => {
    if (!status) return null
    
    if (status === 'full') {
      return <div className="bg-green-500 rounded-full w-4 h-4 mx-auto" />
    }
    
    if (status === 'half') {
      return <div className="bg-yellow-400 rounded-full w-4 h-4 mx-auto" />
    }
    
    return null
  }

  return (
    <div className="w-full space-y-4">
      {/* Header with export button */}
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-lg font-semibold text-foreground">Control de Asistencia</h3>
          <p className="text-xs text-muted-foreground">
            <span className="inline-flex items-center gap-1">
              <div className="bg-green-500 rounded-full w-3 h-3" />
              Jornada completa
            </span>
            <span className="inline-flex items-center gap-1 ml-4">
              <div className="bg-yellow-400 rounded-full w-3 h-3" />
              Medio jornal
            </span>
          </p>
        </div>
        {onExportAttendance && (
          <Button 
            onClick={onExportAttendance}
            variant="outline" 
            size="sm"
            className="gap-2"
          >
            <Download className="w-4 h-4" />
            Exportar Asistencia
          </Button>
        )}
      </div>

      {/* Gradebook table */}
      <div className="border rounded-lg overflow-hidden bg-card">
        <div className="overflow-x-auto">
          <table className="w-full">
            {/* Header row with days */}
            <thead>
              <tr className="bg-muted border-b">
                <th className="sticky left-0 bg-muted border-r px-4 py-2 text-left text-xs font-medium text-muted-foreground min-w-[140px]">
                  Personal
                </th>
                {days.map(day => (
                  <th 
                    key={day} 
                    className="px-2 py-2 text-center text-xs font-medium text-muted-foreground min-w-[32px]"
                  >
                    {day}
                  </th>
                ))}
              </tr>
            </thead>
            
            {/* Body rows with workers and attendance */}
            <tbody>
              {workers.map((worker, rowIndex) => (
                <tr 
                  key={worker.id} 
                  className={`border-b hover:bg-muted/50 ${
                    rowIndex % 2 === 0 ? 'bg-background' : 'bg-muted/20'
                  }`}
                >
                  <td className="sticky left-0 bg-inherit border-r px-4 py-3 text-sm font-medium text-foreground">
                    {worker.name}
                  </td>
                  {days.map(day => {
                    const status = getAttendance(worker.id, day)
                    return (
                      <td 
                        key={day} 
                        className="px-2 py-3 text-center align-middle h-12"
                      >
                        {renderAttendanceCell(status)}
                      </td>
                    )
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Summary statistics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-center">
        <div className="bg-card border rounded-lg p-3">
          <div className="text-lg font-semibold text-foreground">
            {workers.length}
          </div>
          <div className="text-xs text-muted-foreground">Total Personal</div>
        </div>
        <div className="bg-card border rounded-lg p-3">
          <div className="text-lg font-semibold text-green-600">
            {attendance.filter(a => a.status === 'full').length}
          </div>
          <div className="text-xs text-muted-foreground">Jornadas Completas</div>
        </div>
        <div className="bg-card border rounded-lg p-3">
          <div className="text-lg font-semibold text-yellow-600">
            {attendance.filter(a => a.status === 'half').length}
          </div>
          <div className="text-xs text-muted-foreground">Medios Jornales</div>
        </div>
      </div>
    </div>
  )
}

export default CustomGradebook