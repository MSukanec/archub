import { useCurrentUser } from "@/hooks/use-current-user";
import { Layout as ClassicLayout } from "../desktop-layout-classic/Layout";
import { Layout as ExperimentalLayout } from "../desktop-layout-experimental/Layout";

// Dynamic Layout wrapper that loads the correct layout based on user preferences
export function Layout(props: any) {
  const { data: userData } = useCurrentUser();
  const layoutPreference = userData?.preferences?.layout || 'classic';
  
  // Load the appropriate layout based on user preference
  if (layoutPreference === 'experimental') {
    return <ExperimentalLayout {...props} />;
  }
  
  // Default to classic layout
  return <ClassicLayout {...props} />;
}
