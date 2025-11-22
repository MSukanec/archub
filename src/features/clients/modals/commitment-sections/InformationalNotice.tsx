import { Info } from 'lucide-react'

interface InformationalNoticeProps {
  message: string
}

export function InformationalNotice({ message }: InformationalNoticeProps) {
  return (
    <div className="mt-4 p-4 bg-muted/50 rounded-lg border border-border">
      <div className="flex items-start gap-3">
        <Info className="h-5 w-5 text-muted-foreground mt-0.5 flex-shrink-0" />
        <p className="text-sm text-muted-foreground leading-relaxed">
          {message}
        </p>
      </div>
    </div>
  )
}
