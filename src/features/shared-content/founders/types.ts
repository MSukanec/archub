import type { LucideIcon } from 'lucide-react';

export type FoundersMode = 'public' | 'dashboard';

export interface FoundersContentProps {
  mode: FoundersMode;
  showHero?: boolean;
}

export interface FoundersSectionProps {
  mode: FoundersMode;
}

export interface Benefit {
  icon: LucideIcon;
  title: string;
  description: string;
}
