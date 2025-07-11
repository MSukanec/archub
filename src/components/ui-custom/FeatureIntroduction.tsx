import React, { useState } from 'react'
import { X } from 'lucide-react'
import { Button } from '@/components/ui/button'
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
  const [isVisible, setIsVisible] = useState(true)

  const handleDismiss = () => {
    setIsVisible(false)
    onDismiss?.()
  }

  if (!isVisible) return null

  return (
    <div className={cn(
      "w-full bg-black text-white rounded-lg overflow-hidden shadow-lg mb-6",
      className
    )}>
      {/* Header with close button */}
      <div className="relative p-6 pb-4">
        <Button
          variant="ghost"
          size="sm"
          onClick={handleDismiss}
          className="absolute top-4 right-4 h-8 w-8 p-0 text-white/60 hover:text-white hover:bg-white/10"
        >
          <X className="h-4 w-4" />
        </Button>

        {/* Title and Image */}
        <div className="flex flex-col items-center text-center space-y-4">
          <h2 className="text-2xl font-bold text-white">
            {title}
          </h2>
          
          {image && (
            <div className="flex justify-center">
              {image}
            </div>
          )}
        </div>
      </div>

      {/* Features Grid */}
      <div className="px-6 pb-4">
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

      {/* Got it button */}
      <div className="px-6 pb-6">
        <Button
          onClick={handleDismiss}
          className="w-full bg-green-600 hover:bg-green-700 text-white font-medium"
        >
          Lo tengo
        </Button>
      </div>
    </div>
  )
}