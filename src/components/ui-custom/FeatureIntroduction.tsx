import React, { useState } from 'react'
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
        "w-full text-white overflow-hidden shadow-lg mb-6 cursor-pointer transition-all duration-300 ease-in-out",
        className
      )}
      style={{ 
        backgroundColor: 'var(--secondary-sidebar-bg)',
        borderRadius: 'var(--radius-sm)'
      }}
      onMouseEnter={() => setIsExpanded(true)}
      onMouseLeave={() => setIsExpanded(false)}
    >
      {/* Always visible title */}
      <div className="p-6">
        <h2 className="text-2xl font-bold text-white text-center">
          {title}
        </h2>
      </div>

      {/* Expandable content */}
      {isExpanded && (
        <div className="pb-6 animate-in fade-in duration-300">
          {/* Image */}
          {image && (
            <div className="flex justify-center mb-6">
              {image}
            </div>
          )}

          {/* Features Grid */}
          <div className="px-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {features.map((feature, index) => (
                <div key={index} className="flex items-start space-x-3">
                  <div className="flex-shrink-0 mt-1">
                    {feature.icon}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="text-sm font-medium text-white mb-1">
                      {feature.title}
                    </h3>
                    <p className="text-sm text-white/70 leading-relaxed">
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