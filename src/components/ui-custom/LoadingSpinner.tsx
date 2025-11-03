interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  fullScreen?: boolean;
}

export function LoadingSpinner({ size = 'md', fullScreen = false }: LoadingSpinnerProps) {
  const sizeClasses = {
    sm: { spinner: 'w-12 h-12', logo: 'w-6 h-6' },
    md: { spinner: 'w-16 h-16', logo: 'w-8 h-8' },
    lg: { spinner: 'w-24 h-24', logo: 'w-12 h-12' },
    xl: { spinner: 'w-32 h-32', logo: 'w-16 h-16' }
  };

  const { spinner: spinnerSize, logo: logoSize } = sizeClasses[size];

  const spinner = (
    <div className="relative flex items-center justify-center">
      <div 
        className={`${spinnerSize} rounded-full animate-spin`}
        style={{
          background: 'conic-gradient(from 0deg, transparent 0deg, var(--accent) 30deg, var(--accent) 180deg, var(--accent) 270deg, transparent 300deg)',
          WebkitMask: 'radial-gradient(farthest-side, transparent calc(100% - 3px), #000 calc(100% - 3px))',
          mask: 'radial-gradient(farthest-side, transparent calc(100% - 3px), #000 calc(100% - 3px))'
        }}
      />
      <img 
        src="/ArchubLogo.png" 
        alt="Archub" 
        className={`${logoSize} absolute`}
      />
    </div>
  );

  if (fullScreen) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        {spinner}
      </div>
    );
  }

  return spinner;
}
