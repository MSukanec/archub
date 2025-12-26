import { MarketingLayout } from "@/layouts/marketing";
import { FoundersContent, HeroSection } from "@/features/shared-content/founders";

export default function FoundersPage() {
  return (
    <MarketingLayout
      headerNavigation={[
        { label: "Cursos", href: "/cursos" },
        { label: "Fundadores", href: "/founders" },
        { label: "Precios", href: "/precios" },
        { label: "Contacto", href: "/contact" }
      ]}
      heroSlot={<HeroSection mode="public" />}
      seo={{
        title: "Programa de Miembros Fundadores | Seencel",
        description: "Únete al círculo exclusivo de pioneros de Seencel. Accede a beneficios vitalicios, influye en el desarrollo del producto y forma parte de la historia de la gestión de construcción.",
        ogTitle: "Programa de Miembros Fundadores - Seencel",
        ogDescription: "Beneficios exclusivos vitalicios para los primeros usuarios comprometidos. Acceso anticipado, comunidad privada, insignia de fundador y más."
      }}
    >
      <FoundersContent mode="public" showHero={false} />
    </MarketingLayout>
  );
}
