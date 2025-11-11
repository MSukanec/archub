import { useLocation } from "wouter";

export function useContentBackground(): string {
  const [location] = useLocation();
  
  const isProjectPage = location.startsWith('/project/');
  
  if (isProjectPage) {
    return 'linear-gradient(to bottom, var(--content-gradient-from), var(--content-gradient-to))';
  }
  
  return 'var(--content-bg)';
}
