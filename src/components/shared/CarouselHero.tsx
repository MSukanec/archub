import { useState, useEffect } from 'react'
import { ChevronLeft, ChevronRight, Play } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'

export interface CarouselSection {
  id: string
  title: string
  description: string
  media_url?: string
  media_type?: 'image' | 'video'
  primary_button_text?: string
  primary_button_action?: string
  primary_button_action_type?: 'url' | 'internal_route' | 'external'
  secondary_button_text?: string
  secondary_button_action?: string
  secondary_button_action_type?: 'url' | 'internal_route' | 'external'
  badge_text?: string
}

interface CarouselHeroProps {
  sections: CarouselSection[]
  autoplay?: boolean
  autoplayInterval?: number
  height?: string
  onNavigate?: (index: number, section: CarouselSection) => void
  onButtonClick?: (buttonType: 'primary' | 'secondary', action: string, actionType: string) => void
}

export default function CarouselHero({
  sections,
  autoplay = true,
  autoplayInterval = 5000,
  height = 'h-96',
  onNavigate,
  onButtonClick
}: CarouselHeroProps) {
  const [currentIndex, setCurrentIndex] = useState(0)
  const [isPaused, setIsPaused] = useState(false)

  if (!sections || sections.length === 0) {
    return null
  }

  useEffect(() => {
    if (!autoplay || isPaused) return

    const timer = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % sections.length)
    }, autoplayInterval)

    return () => clearInterval(timer)
  }, [autoplay, autoplayInterval, sections.length, isPaused])

  const currentSection = sections[currentIndex]

  const handlePrevious = () => {
    const newIndex = (currentIndex - 1 + sections.length) % sections.length
    setCurrentIndex(newIndex)
    onNavigate?.(newIndex, sections[newIndex])
  }

  const handleNext = () => {
    const newIndex = (currentIndex + 1) % sections.length
    setCurrentIndex(newIndex)
    onNavigate?.(newIndex, sections[newIndex])
  }

  const handleButtonClick = (
    buttonType: 'primary' | 'secondary',
    action: string,
    actionType: string
  ) => {
    if (onButtonClick) {
      onButtonClick(buttonType, action, actionType)
    } else {
      // Default behavior
      if (actionType === 'internal_route') {
        window.location.href = action
      } else if (actionType === 'external' || actionType === 'url') {
        window.open(action, '_blank')
      }
    }
  }

  return (
    <div
      className={`relative ${height} overflow-hidden w-full group`}
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
      data-testid="carousel-hero"
    >
      {/* Background Media */}
      {currentSection.media_url ? (
        <>
          {currentSection.media_type === 'video' ? (
            <video
              src={currentSection.media_url}
              autoPlay
              muted
              loop
              className="absolute inset-0 w-full h-full object-cover"
              data-testid="carousel-video"
            />
          ) : (
            <div
              className="absolute inset-0 bg-cover bg-center bg-no-repeat motion-reduce:bg-scroll"
              style={{
                backgroundImage: `url(${currentSection.media_url})`,
                backgroundPosition: 'center center'
              }}
              data-testid="carousel-image"
            />
          )}
          <div className="absolute inset-0 bg-gradient-to-b from-black/20 via-black/60 to-black/100 dark:from-black/30 dark:via-black/70 dark:to-black/100" />
        </>
      ) : (
        <div className="absolute inset-0 bg-gradient-to-br from-accent/10 to-accent/5 dark:from-accent/20 dark:to-accent/10" />
      )}

      {/* Content */}
      <div className="relative h-full flex flex-col justify-end px-4 sm:px-6 md:px-12 py-4 sm:py-6 md:py-12">
        <div className="max-w-3xl">
          {/* Badge */}
          {(currentSection.badge_text || currentIndex + 1) && (
            <div className="mb-3 sm:mb-6">
              <Badge
                style={{
                  backgroundColor: 'var(--accent)',
                  color: 'white',
                  borderColor: 'var(--accent)'
                }}
                className="text-[9px] sm:text-[10px] md:text-xs font-medium uppercase px-3 sm:px-4 py-1.5 sm:py-2"
                data-testid="carousel-badge"
              >
                {currentSection.badge_text || `${currentIndex + 1} / ${sections.length}`}
              </Badge>
            </div>
          )}

          {/* Title */}
          <h1
            className="text-lg sm:text-2xl md:text-5xl font-bold mb-2 sm:mb-4 md:mb-6 tracking-tight !text-white line-clamp-2"
            data-testid="carousel-title"
          >
            {currentSection.title}
          </h1>

          {/* Description */}
          {currentSection.description && (
            <p className="text-xs sm:text-sm md:text-base max-w-2xl mb-4 sm:mb-8 text-[rgb(220,220,220)] line-clamp-2 sm:line-clamp-3">
              {currentSection.description}
            </p>
          )}

          {/* Buttons */}
          <div className="flex gap-3 flex-wrap">
            {currentSection.primary_button_text && currentSection.primary_button_action && (
              <Button
                size="sm"
                onClick={() =>
                  handleButtonClick(
                    'primary',
                    currentSection.primary_button_action!,
                    currentSection.primary_button_action_type || 'url'
                  )
                }
                className="group/btn text-xs sm:text-sm md:text-base"
                data-testid="carousel-primary-button"
              >
                <span>{currentSection.primary_button_text}</span>
                <ChevronRight className="ml-1 sm:ml-2 h-3 w-3 sm:h-4 sm:w-4 transition-transform group-hover/btn:translate-x-1" />
              </Button>
            )}

            {currentSection.secondary_button_text && currentSection.secondary_button_action && (
              <Button
                size="sm"
                variant="outline"
                onClick={() =>
                  handleButtonClick(
                    'secondary',
                    currentSection.secondary_button_action!,
                    currentSection.secondary_button_action_type || 'url'
                  )
                }
                className="text-xs sm:text-sm md:text-base border-white/30 hover:bg-white/10"
                data-testid="carousel-secondary-button"
              >
                {currentSection.secondary_button_text}
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Navigation - Hidden on small screens, shown on hover for larger screens */}
      {sections.length > 1 && (
        <>
          <button
            onClick={handlePrevious}
            className="absolute left-2 sm:left-4 top-1/2 -translate-y-1/2 z-10 p-2 rounded-full bg-white/10 hover:bg-white/20 opacity-0 group-hover:opacity-100 transition-opacity hidden sm:flex items-center justify-center"
            aria-label="Previous slide"
            data-testid="carousel-previous"
          >
            <ChevronLeft className="w-4 h-4 sm:w-6 sm:h-6 text-white" />
          </button>

          <button
            onClick={handleNext}
            className="absolute right-2 sm:right-4 top-1/2 -translate-y-1/2 z-10 p-2 rounded-full bg-white/10 hover:bg-white/20 opacity-0 group-hover:opacity-100 transition-opacity hidden sm:flex items-center justify-center"
            aria-label="Next slide"
            data-testid="carousel-next"
          >
            <ChevronRight className="w-4 h-4 sm:w-6 sm:h-6 text-white" />
          </button>

          {/* Dots indicator */}
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-10 flex gap-2">
            {sections.map((_, index) => (
              <button
                key={index}
                onClick={() => {
                  setCurrentIndex(index)
                  onNavigate?.(index, sections[index])
                }}
                className={`h-2 rounded-full transition-all ${
                  index === currentIndex ? 'bg-white w-8' : 'bg-white/50 w-2 hover:bg-white/75'
                }`}
                aria-label={`Go to slide ${index + 1}`}
                data-testid={`carousel-dot-${index}`}
              />
            ))}
          </div>
        </>
      )}
    </div>
  )
}
