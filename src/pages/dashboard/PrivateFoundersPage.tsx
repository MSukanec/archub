import { Layout } from "@/layouts/dashboard/DashboardLayout";
import { HeroLayout } from "@/layouts/dashboard/HeroLayout";
import { FoundersContent, HeroSection } from "@/features/shared-content/founders";

export default function PrivateFoundersPage() {
  return (
    <Layout hideHeader wide>
      <HeroLayout noPadding>
        <div className="min-h-screen bg-background">
          <HeroSection mode="dashboard" />
          <FoundersContent mode="dashboard" showHero={false} />
        </div>
      </HeroLayout>
    </Layout>
  );
}
