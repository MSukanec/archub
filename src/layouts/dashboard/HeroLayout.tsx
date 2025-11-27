import { type WidthProp, resolveWidthMode, getContainerClasses, getContentPaddingClasses } from "./layoutWidth";

interface HeroLayoutProps {
  children: React.ReactNode;
  wide?: WidthProp;
  noPadding?: boolean;
}

/**
 * HeroLayout - Layout para páginas SIN header, 100% contenido
 * 
 * Es un "hermano" de PageLayout, ambos se usan DENTRO de DashboardLayout.
 * - PageLayout: con header, tabs, acciones
 * - HeroLayout: sin header, contenido fullwidth
 * 
 * Uso:
 * ```tsx
 * <Layout hideHeader wide>
 *   <HeroLayout noPadding>
 *     {contenido fullwidth}
 *   </HeroLayout>
 * </Layout>
 * ```
 * 
 * O directamente dentro de Layout cuando hideHeader={true}
 */
export function HeroLayout({ children, wide = true, noPadding = false }: HeroLayoutProps) {
  const mode = resolveWidthMode(wide);
  
  if (noPadding) {
    return (
      <div className="h-full w-full overflow-auto">
        {children}
      </div>
    );
  }
  
  return (
    <div className={`h-full w-full overflow-auto ${getContainerClasses(mode)} ${getContentPaddingClasses(mode)}`}>
      {children}
    </div>
  );
}

export default HeroLayout;
