import { useEffect } from "react";
import { DashboardLayout as Layout, HeroLayout } from "@/layouts";
import { useNavigationStore } from "@/stores/navigationStore";
import { PricingContent } from "@/features/shared-content/pricing";

export default function PricingPlan() {
  const { setSidebarLevel } = useNavigationStore();

  useEffect(() => {
    setSidebarLevel('organization');
  }, [setSidebarLevel]);

  return (
    <Layout hideHeader>
      <HeroLayout>
        <PricingContent mode="dashboard" />
      </HeroLayout>
    </Layout>
  );
}
