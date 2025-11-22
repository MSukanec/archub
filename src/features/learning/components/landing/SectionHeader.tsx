interface SectionHeaderProps {
  title?: string;
  subtitle?: string;
  description?: string;
}

export function SectionHeader({ title, subtitle, description }: SectionHeaderProps) {
  if (!title && !subtitle && !description) return null;

  return (
    <div className="mb-12 space-y-4">
      {subtitle && (
        <p className="text-base uppercase tracking-wide font-semibold text-[var(--accent)]">
          {subtitle}
        </p>
      )}
      {title && (
        <h2 className="text-7xl font-bold uppercase tracking-tight text-white leading-tight">
          {title}
        </h2>
      )}
      {description && (
        <p className="text-lg text-foreground/80 max-w-3xl leading-relaxed">
          {description}
        </p>
      )}
    </div>
  );
}
