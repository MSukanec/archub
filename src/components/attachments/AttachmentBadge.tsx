import React from 'react'
import { Button } from '@/components/ui/button'
import { FileText, Download, Eye } from 'lucide-react'
import { getCertificatePublicUrl } from '@/services/insurances'
import { useToast } from '@/hooks/use-toast'

interface AttachmentBadgeProps {
  attachmentId: string
  fileName?: string
}

export function AttachmentBadge({ attachmentId, fileName = "Certificado" }: AttachmentBadgeProps) {
  const { toast } = useToast()

  const handleView = async () => {
    try {
      const url = await getCertificatePublicUrl(attachmentId)
      window.open(url, '_blank')
    } catch (error) {
      toast({
        title: "Error",
        description: "No se pudo abrir el certificado",
        variant: "destructive"
      })
    }
  }

  const handleDownload = async () => {
    try {
      const url = await getCertificatePublicUrl(attachmentId)
      const link = document.createElement('a')
      link.href = url
      link.download = fileName
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
    } catch (error) {
      toast({
        title: "Error", 
        description: "No se pudo descargar el certificado",
        variant: "destructive"
      })
    }
  }

  return (
    <div className="flex items-center gap-1">
      <Button
        variant="ghost"
        size="sm"
        onClick={handleView}
        className="h-8 w-8 p-0"
        title="Ver certificado"
      >
        <Eye className="h-4 w-4" />
      </Button>
      
      <Button
        variant="ghost"
        size="sm"
        onClick={handleDownload}
        className="h-8 w-8 p-0"
        title="Descargar certificado"
      >
        <Download className="h-4 w-4" />
      </Button>
      
      <span className="text-xs text-muted-foreground flex items-center gap-1">
        <FileText className="h-3 w-3" />
        {fileName}
      </span>
    </div>
  )
}