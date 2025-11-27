interface LabPageLayoutProps {
  children: React.ReactNode;
  noPadding?: boolean;
  className?: string;
}

/**
 * LabPageLayout - Layout para páginas experimentales del Lab
 * 
 * Se usa DENTRO de DashboardLayout con hideHeader={true}.
 * Proporciona contenido fullwidth para visualizaciones inmersivas.
 * 
 * Uso:
 * ```tsx
 * <DashboardLayout hideHeader wide>
 *   <LabPageLayout>
 *     {contenido del lab}
 *   </LabPageLayout>
 * </DashboardLayout>
 * ```
 */
export function LabPageLayout({ children, noPadding = true, className = '' }: LabPageLayoutProps) {
  if (noPadding) {
    return (
      <div className={`h-full w-full overflow-hidden ${className}`}>
        {children}
      </div>
    );
  }
  
  return (
    <div className={`h-full w-full overflow-auto p-6 ${className}`}>
      {children}
    </div>
  );
}

export default LabPageLayout;
