import { Folder, HardDrive, Users, Briefcase, Bot } from "lucide-react";
import type { PlanConfig, PlanSlug } from "../types";

export const plansConfig: Record<PlanSlug, PlanConfig> = {
  'free': {
    icon: Folder,
    iconColor: '#84cc16',
    bgColor: 'rgba(132, 204, 22, 0.08)',
    cardHeader: 'Perfecto para comenzar',
    description: 'Para profesionales individuales y equipos pequeños',
    features: [
      'Gestión de proyectos',
      'Seguimiento de obra',
      'Finanzas generales',
      'Soporte por email',
      'Documentación de obra'
    ],
    limits: [
      { iconComponent: Folder, value: '4 proyectos' },
      { iconComponent: HardDrive, value: '500 MB' },
      { iconComponent: Bot, value: 'Resúmenes básicos' },
      { iconComponent: Users, value: '1 usuario' }
    ]
  },
  'pro': {
    icon: Bot,
    iconColor: '#0047AB',
    bgColor: 'rgba(0, 71, 171, 0.08)',
    cardHeader: 'Para profesionales avanzados',
    description: 'Para equipos que necesitan funciones avanzadas',
    features: [
      'Todo en Free',
      'PDFs personalizables',
      'Tokens IA avanzados',
      'Integraciones de pago',
      'Soporte prioritario',
      'Visitantes/Clientes ilimitados',
      'Comunidad'
    ],
    limits: [
      { iconComponent: Folder, value: '50 proyectos' },
      { iconComponent: HardDrive, value: '50 GB' },
      { iconComponent: Bot, value: '10,000 tokens/mes' },
      { iconComponent: Users, value: '1 usuario' }
    ]
  },
  'teams': {
    icon: Users,
    iconColor: '#8B5CF6',
    bgColor: 'rgba(139, 92, 246, 0.08)',
    cardHeader: 'Para equipos colaborativos',
    description: 'Para organizaciones con múltiples usuarios',
    features: [
      'Todo en Pro',
      'Miembros ilimitados',
      'Tokens IA ilimitados',
      'Colaboración en tiempo real',
      'Historial de cambios',
      'API de integración',
      'Soporte 24/7'
    ],
    limits: [
      { iconComponent: Folder, value: 'Ilimitados' },
      { iconComponent: HardDrive, value: '500 GB' },
      { iconComponent: Bot, value: 'Ilimitados' },
      { iconComponent: Users, value: 'Ilimitados' }
    ]
  },
  'enterprise': {
    icon: Briefcase,
    iconColor: '#64748b',
    bgColor: 'rgba(100, 116, 139, 0.08)',
    cardHeader: 'Solución personalizada',
    description: 'Para grandes organizaciones con necesidades específicas',
    features: [
      'Todo en Teams',
      'Implementación on-premise',
      'SSO personalizado',
      'Capacitación incluida',
      'Gerente dedicado',
      'SLA 99.9%'
    ],
    limits: []
  }
};

export function getPlanConfig(planName: string): PlanConfig {
  const slug = planName.toLowerCase() as PlanSlug;
  return plansConfig[slug] || plansConfig['free'];
}
