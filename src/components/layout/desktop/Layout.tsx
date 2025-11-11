import { useCurrentUser } from "@/hooks/use-current-user";
import { Layout as RoundedLayout } from "../desktop-rounded/Layout";
import { Layout as FlatLayout } from "../desktop-flat/Layout";

// Dynamic Layout wrapper that loads the correct layout based on user preferences
export function Layout(props: any) {
  const { data: userData } = useCurrentUser();
  const layoutPreference = userData?.preferences?.layout || 'rounded';
  
  // Load the appropriate layout based on user preference
  if (layoutPreference === 'flat') {
    return <FlatLayout {...props} />;
  }
  
  // Default to rounded layout
  return <RoundedLayout {...props} />;
}
