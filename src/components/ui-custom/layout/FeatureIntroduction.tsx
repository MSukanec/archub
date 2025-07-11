import React, { useState } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { ChevronDown, ChevronUp, HelpCircle } from 'lucide-react'
import { cn } from '@/lib/utils'

interface FeatureIntroductionProps {
  icon?: React.ComponentType<any>
  title: string
  helpText?: string
  features: Array<{
    title: string
    description: string
  }>
}

export function FeatureIntroduction({ 
  icon: Icon, 
  title, 
  helpText, 
  features 
}: FeatureIntroductionProps) {
  const [isExpanded, setIsExpanded] = useState(false)

  return (
    <Card className="mb-6">
      <CardContent className="p-4">
        {/* Header */}
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-3">
            {Icon && (
              <Icon className="w-5 h-5 text-[var(--accent)]" />
            )}
            <h2 className="text-lg font-semibold">
              {title}
            </h2>
          </div>
          <div className="flex items-center gap-2">
            {helpText && (
              <div className="flex items-center gap-1 text-sm text-muted-foreground">
                <span>{helpText}</span>
                <HelpCircle className="w-4 h-4" />
              </div>
            )}
            <button
              onClick={() => setIsExpanded(!isExpanded)}
              className="p-1 hover:bg-muted rounded-md transition-colors"
            >
              {isExpanded ? (
                <ChevronUp className="w-4 h-4 text-muted-foreground" />
              ) : (
                <ChevronDown className="w-4 h-4 text-muted-foreground" />
              )}
            </button>
          </div>
        </div>

        {/* Expandable content */}
        <div className={cn(
          "transition-all duration-300 overflow-hidden",
          isExpanded ? "max-h-96 opacity-100" : "max-h-0 opacity-0"
        )}>
          <div className="pt-2">
            {features.map((feature, index) => (
              <div key={index} className="mb-3 last:mb-0">
                <h3 className="font-medium text-sm mb-1">
                  {feature.title}
                </h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {feature.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}