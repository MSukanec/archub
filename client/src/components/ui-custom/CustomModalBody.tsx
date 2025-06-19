import { cn } from '@/lib/utils'

interface CustomModalBodyProps {
  children: React.ReactNode
  className?: string
  padding?: 'none' | 'sm' | 'md' | 'lg'
}

export function CustomModalBody({
  children,
  className,
  padding = 'md'
}: CustomModalBodyProps) {
  const paddingClasses = {
    none: '',
    sm: 'p-4',
    md: 'p-6',
    lg: 'p-8'
  }

  return (
    <div className={cn(
      "flex-1 overflow-y-auto",
      paddingClasses[padding],
      className
    )}>
      {children}
    </div>
  )
}