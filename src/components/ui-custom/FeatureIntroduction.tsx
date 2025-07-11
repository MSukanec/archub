import React, { useState } from 'react'
import { HelpCircle } from 'lucide-react'
import { cn } from '@/lib/utils'

interface FeatureItem {
  icon: React.ReactNode
  title: string
  description: string
}

interface FeatureIntroductionProps {
  title: string
  image?: React.ReactNode
  features: FeatureItem[]
  onDismiss?: () => void
  className?: string
}

export function FeatureIntroduction({
  title,
  image,
  features,
  onDismiss,
  className
}: FeatureIntroductionProps) {
  const [isExpanded, setIsExpanded] = useState(false)

  return (
    <div 
      className={cn(
        "w-full bg-card border border-border rounded-md shadow-sm mb-6 cursor-pointer transition-all duration-300 ease-in-out hover:shadow-md",
        className
      )}
      onMouseEnter={() => setIsExpanded(true)}
      onMouseLeave={() => setIsExpanded(false)}
    >
      {/* Always visible title */}
      <div className="p-6">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold text-foreground">
            {title}
          </h2>
          <HelpCircle className="w-5 h-5 text-muted-foreground" />
        </div>
      </div>

      {/* Expandable content */}
      {isExpanded && (
        <div className="pb-6 animate-in fade-in duration-300">
          {/* Features Grid */}
          <div className="px-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {features.map((feature, index) => (
                <div key={index} className="flex items-start space-x-3">
                  <div className="flex-shrink-0 mt-1 text-primary">
                    {feature.icon}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="text-sm font-medium text-foreground mb-1">
                      {feature.title}
                    </h3>
                    <p className="text-sm text-muted-foreground leading-relaxed">
                      {feature.description}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}