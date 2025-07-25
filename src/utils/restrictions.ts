export interface RestrictionMessage {
  message: string;
  actionLabel: string;
  actionUrl: string;
  planType?: 'teams' | 'pro' | 'enterprise';
  iconColor?: string;
  backgroundColor?: string;
  borderColor?: string;
}

export const restrictionMessages: Record<string, RestrictionMessage> = {
  export_pdf_custom: {
    message: "Esta funcionalidad está disponible solo en el plan PRO.",
    actionLabel: "Actualizar plan",
    actionUrl: "/billing",
  },
  max_projects: {
    message: "Ya alcanzaste el máximo de proyectos para tu plan actual.",
    actionLabel: "Ver planes",
    actionUrl: "/billing",
  },
  max_organizations: {
    message: "Has alcanzado el límite de organizaciones para tu plan actual.",
    actionLabel: "Actualizar plan",
    actionUrl: "/billing",
  },
  advanced_analytics: {
    message: "Los análisis avanzados están disponibles en el plan PRO.",
    actionLabel: "Actualizar plan",
    actionUrl: "/billing",
  },
  team_management: {
    message: "La gestión avanzada de equipos requiere el plan PRO.",
    actionLabel: "Ver planes",
    actionUrl: "/billing",
  },
  max_members: {
    message: "Has alcanzado el límite máximo de miembros para tu plan actual. Actualiza a Teams para más miembros.",
    actionLabel: "Actualizar a Teams",
    actionUrl: "/billing",
    planType: 'teams',
    iconColor: '#10b981',
    backgroundColor: '#10b981',
    borderColor: '#10b981',
  },
  custom_templates: {
    message: "Las plantillas personalizadas están disponibles en el plan PRO.",
    actionLabel: "Actualizar plan",
    actionUrl: "/billing",
  },
  api_access: {
    message: "El acceso a la API está disponible solo en planes empresariales.",
    actionLabel: "Contactar ventas",
    actionUrl: "/contact",
  },
  coming_soon: {
    message: "Esta función estará disponible próximamente.",
    actionLabel: "",
    actionUrl: "",
  },
  beta_feature: {
    message: "Esta función está en fase beta y pronto estará disponible.",
    actionLabel: "Saber más",
    actionUrl: "/roadmap",
  },
};

export function getRestrictionMessage(key: string): RestrictionMessage {
  return restrictionMessages[key] || {
    message: "Esta funcionalidad no está disponible en tu plan actual.",
    actionLabel: "Ver planes",
    actionUrl: "/billing",
  };
}