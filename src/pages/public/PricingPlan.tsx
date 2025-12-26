import { MarketingLayout } from "@/layouts/marketing";
import { PricingContent } from "@/features/shared-content/pricing";

export default function PricingPlanPublic() {
  return (
    <MarketingLayout
      headerNavigation={[
        { label: "Cursos", href: "/cursos" },
        { label: "Fundadores", href: "/founders" },
        { label: "Precios", href: "/precios" },
        { label: "Contacto", href: "/contact" }
      ]}
      seo={{
        title: "Planes y Precios | Seencel",
        description: "Descubre nuestros planes de precios flexibles para la gestión de construcción. Desde Free hasta Enterprise, encuentra el plan perfecto para tu equipo.",
        ogTitle: "Planes y Precios - Seencel",
        ogDescription: "Soluciones de gestión de construcción con planes para cualquier tamaño de equipo. Comienza gratis o upgrade a Pro."
      }}
    >
      <PricingContent mode="public" />
    </MarketingLayout>
  );
}
