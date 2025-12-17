// Configuración de modos de uso de la aplicación
// Cada modo define qué contextos y botones se muestran en los sidebars

export type UserMode = 'professional' | 'learner' | 'provider' | 'worker';

export type SidebarContext = 'general' | 'organization' | 'project' | 'learning' | 'community' | 'admin' | 'user' | 'founders';

export interface ModeConfig {
  leftSidebar: {
    // Contextos permitidos para este modo
    allowedContexts: SidebarContext[];
    // Botones excluidos (no se mostrarán)
    excludedButtons?: SidebarContext[];
  };
  // TODO: Agregar rightSidebar cuando se implemente
}

export const modeConfigs: Record<UserMode, ModeConfig> = {
  // Modo PROFESIONAL - Acceso completo a organización, proyectos y capacitaciones
  professional: {
    leftSidebar: {
      allowedContexts: ['general', 'community', 'organization', 'project', 'learning', 'admin', 'user'],
      excludedButtons: [], // Acceso a todos los botones incluyendo Capacitaciones
    }
  },

  // Modo LEARNER - Deprecado, mantiene mismos permisos que professional para compatibilidad
  learner: {
    leftSidebar: {
      allowedContexts: ['general', 'community', 'organization', 'project', 'learning', 'admin', 'user'],
      excludedButtons: [],
    }
  },

  // Modo PROVEEDOR - Para implementar en el futuro
  provider: {
    leftSidebar: {
      allowedContexts: ['general', 'user'],
      excludedButtons: ['organization', 'project', 'learning', 'community'],
    }
  },

  // Modo MANO DE OBRA - Para implementar en el futuro
  worker: {
    leftSidebar: {
      allowedContexts: ['general', 'user'],
      excludedButtons: ['organization', 'project', 'learning', 'community'],
    }
  }
};

// Helper function para verificar si un contexto está permitido en un modo
export function isContextAllowed(mode: UserMode, context: SidebarContext): boolean {
  return modeConfigs[mode].leftSidebar.allowedContexts.includes(context);
}

// Helper function para verificar si un botón está excluido en un modo
export function isButtonExcluded(mode: UserMode, button: SidebarContext): boolean {
  return modeConfigs[mode].leftSidebar.excludedButtons?.includes(button) ?? false;
}
