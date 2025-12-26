interface SectionHeaderProps {
  title?: string;
  subtitle?: string;
  description?: string;
  align?: 'left'| 'center';
  variant?: 'default'| 'dark-bg';
}
export function SectionHeader({ 
  title, 
  subtitle, 
  description,
  align = 'left',
  variant = 'default'
}: SectionHeaderProps) {
  if (!title && !subtitle && !description) return null;
  const alignClass = align === 'center'? 'text-center': 'text-left';
  const descriptionAlignClass = align === 'center'? 'mx-auto': '';
  
  const subtitleColor = variant === 'dark-bg'
    ? 'text-accent'
    : 'text-accent dark:text-accent';
  
  const titleColor = variant === 'dark-bg'
    ? 'text-white'
    : 'text-foreground';
  
  const descriptionColor = variant === 'dark-bg'
    ? 'text-gray-300'
    : 'text-muted-foreground';
  return (
    <div className={`mb-12 space-y-4 ${alignClass}`}>
      {subtitle && (
        <p className={`text-xs sm:text-sm md:text-base uppercase tracking-wide font-semibold ${subtitleColor}`}>
          {subtitle}
        </p>
      )}
      {title && (
        <h2 className={`text-3xl sm:text-5xl lg:text-7xl font-bold uppercase tracking-tight leading-tight ${titleColor}`}>
          {title}
        </h2>
      )}
      {description && (
        <p className={`text-sm sm:text-base lg:text-lg max-w-3xl leading-relaxed ${descriptionColor} ${descriptionAlignClass}`}>
          {description}
        </p>
      )}
    </div>
  );
}
