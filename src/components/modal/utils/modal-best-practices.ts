/**
 * MODAL INFRASTRUCTURE - GUÍA DE MEJORES PRÁCTICAS
 * 
 * Esta guía documenta todos los patrones y mejores prácticas para usar la 
 * infraestructura mejorada de modales.
 * 
 * 🎯 OBJETIVOS COMPLETADOS:
 * ✅ Readiness Pattern Standard implementado
 * ✅ FormModalFooter con canSubmit robusto y prevención double-submit
 * ✅ FormModalLayout con mejor onSubmit y ENTER key support
 * ✅ ModalErrorBoundary para manejo de errores elegante
 * ✅ Documentación completa de mejores prácticas
 */

import { useModalReadiness, buildScopedQueryKey, QUERY_KEY_PATTERNS } from './modal-readiness';
import { ModalErrorBoundary } from './ModalErrorBoundary';
import { FormModalLayout } from '../form/FormModalLayout';
import { FormModalHeader } from '../form/FormModalHeader';
import { FormModalFooter } from '../form/FormModalFooter';

// =====================================================
// 📋 TABLA DE CONTENIDOS
// =====================================================
/*
1. 🛡️  READINESS PATTERNS - Cómo implementar guards correctamente
2. 🗝️  QUERY KEY PATTERNS - organizationId/projectId en queryKey  
3. 🏗️  STANDARD LAYOUTS - Patrones estándar para header/footer
4. ⌨️  KEYBOARD & ACCESSIBILITY - Shortcuts y mejores prácticas
5. 🔄  LOADING STATES - Manejo consistente de carga
6. ❌  ERROR HANDLING - Error boundaries y recovery
7. 📝  FORM PATTERNS - Patrones para formularios
8. 🎛️  ADVANCED FEATURES - Funcionalidades avanzadas
9. 🧪  TESTING PATTERNS - Cómo testear modales
10. 📊 EXAMPLES - Ejemplos completos y casos de uso
*/

// =====================================================
// 1. 🛡️ READINESS PATTERNS
// =====================================================

/**
 * PATRÓN ESTÁNDAR: Readiness Guards
 * 
 * Todos los modales deben usar readiness guards para asegurar que:
 * - Los datos críticos estén cargados antes de mostrar el contenido
 * - Los estados de loading sean consistentes
 * - Los inputs estén deshabilitados durante carga
 * - Los errores se muestren elegantemente
 */

// ✅ EJEMPLO CORRECTO: Modal con Readiness Pattern
export const ExampleModalWithReadiness = () => {
  const { data: userData } = useCurrentUser();
  const { data: projectData } = useProject(projectId);
  const { data: contactTypes } = useContactTypes();

  // 🔥 IMPLEMENTAR READINESS GUARD
  const readiness = useModalReadiness({
    criticalQueries: [
      useCurrentUser(),
      useProject(projectId),
    ],
    optionalQueries: [
      useContactTypes(),
    ],
    requiredIds: {
      organizationId: userData?.organization?.id,
      projectId: projectId,
    },
    onReady: () => {
    },
    onError: (error) => {
    },
  });

  // 🔥 USAR LOADING GATE EN LUGAR DE RENDERIZADO CONDICIONAL
  return (
    <FormModalLayout
      readinessState={readiness}
      headerContent={
        <FormModalHeader
          title="Ejemplo Modal"
          readinessState={readiness}
        />
      }
      footerContent={
        <FormModalFooter
          readinessState={readiness}
          onSubmit={() => handleSubmit()}
        />
      }
    >
      <readiness.LoadingGate>
        {/* Contenido solo se muestra cuando está ready */}
        <ContactForm />
      </readiness.LoadingGate>
    </FormModalLayout>
  );
};

// ❌ EJEMPLO INCORRECTO: Sin readiness pattern
export const BadModalExample = () => {
  const { data: userData, isLoading: userLoading } = useCurrentUser();
  const { data: projectData, isLoading: projectLoading } = useProject(projectId);

  // ❌ MAL: Lógica de loading dispersa
  if (userLoading || projectLoading) {
    return <div>Loading...</div>;
  }

  // ❌ MAL: No verifica errores ni IDs requeridos
  return <div>Contenido</div>;
};

// =====================================================
// 2. 🗝️ QUERY KEY PATTERNS
// =====================================================

/**
 * PATRONES DE QUERY KEYS - Guía definitiva
 * 
 * 🎯 REGLA: Todos los hooks que dependen de contexto deben incluir
 * el scope apropiado en su queryKey para cache invalidation correcto
 */

// ✅ QUERIES QUE NECESITAN ORGANIZATION SCOPE
export const ORGANIZATION_SCOPED_QUERIES = {
  // Contacts y recursos organizacionales
  contacts: (orgId: string) => buildScopedQueryKey('contacts', 'organization', orgId),
  contactTypes: (orgId: string) => buildScopedQueryKey('contact-types', 'organization', orgId),
  
  // Miembros y roles
  members: (orgId: string) => buildScopedQueryKey('members', 'organization', orgId),
  roles: (orgId: string) => buildScopedQueryKey('roles', 'organization', orgId),
  
  // Movimientos financieros
  movements: (orgId: string) => buildScopedQueryKey('movements', 'organization', orgId),
  movementConcepts: (orgId: string) => buildScopedQueryKey('movement-concepts', 'organization', orgId),
  
  // Proyectos de la organización
  projects: (orgId: string) => buildScopedQueryKey('projects', 'organization', orgId),
};

// ✅ QUERIES QUE NECESITAN PROJECT SCOPE
export const PROJECT_SCOPED_QUERIES = {
  // Construcción y tareas
  tasks: (projectId: string) => buildScopedQueryKey('tasks', 'project', projectId),
  phases: (projectId: string) => buildScopedQueryKey('phases', 'project', projectId),
  budgets: (projectId: string) => buildScopedQueryKey('budgets', 'project', projectId),
  
  // Subcontratos y recursos
  subcontracts: (projectId: string) => buildScopedQueryKey('subcontracts', 'project', projectId),
  materials: (projectId: string) => buildScopedQueryKey('materials', 'project', projectId),
  personnel: (projectId: string) => buildScopedQueryKey('personnel', 'project', projectId),
  
  // Media y documentos del proyecto
  documents: (projectId: string) => buildScopedQueryKey('documents', 'project', projectId),
  gallery: (projectId: string) => buildScopedQueryKey('gallery', 'project', projectId),
};

// ✅ QUERIES GLOBALES (no necesitan scope)
export const GLOBAL_QUERIES = {
  currentUser: () => buildScopedQueryKey('current-user', 'global'),
  systemRoles: () => buildScopedQueryKey('system-roles', 'global'),
  currencies: () => buildScopedQueryKey('currencies', 'global'),
  countries: () => buildScopedQueryKey('countries', 'global'),
};

// 🔥 EJEMPLO DE USO CORRECTO
export const useContactsWithCorrectQueryKey = (organizationId?: string) => {
  return useQuery({
    queryKey: ORGANIZATION_SCOPED_QUERIES.contacts(organizationId!),
    queryFn: () => fetchContacts(organizationId),
    enabled: !!organizationId,
  });
};

// =====================================================
// 3. 🏗️ STANDARD LAYOUTS
// =====================================================

/**
 * PATRONES ESTÁNDAR para Header/Footer
 */

// ✅ PATRÓN: Modal de Formulario Estándar
export const StandardFormModalPattern = () => {
  const readiness = useModalReadiness(/* ... */);
  const form = useForm(/* ... */);

  return (
    <FormModalLayout
      readinessState={readiness}
      wide={false} // 600px default
      // wide={true} // 1200px para formularios complejos
      // fullscreen={true} // pantalla completa para casos especiales
      
      headerContent={
        <FormModalHeader
          title="Título del Modal"
          description="Descripción clara de lo que hace este modal"
          icon={UserPlus}
          readinessState={readiness}
          
          // Para modales de múltiples pasos
          progress={{
            current: 1,
            total: 3,
            showNumbers: true,
          }}
          
          // Para navegación jerárquica
          breadcrumbs={[
            { label: 'Proyectos', onClick: () => navigate('/projects') },
            { label: 'Mi Proyecto', current: true },
          ]}
        />
      }
      
      footerContent={
        <FormModalFooter
          // API simplificada para casos comunes
          cancelText="Cancelar"
          submitText="Guardar"
          onSubmit={form.handleSubmit(onSubmit)}
          
          // Integración con readiness y form state
          readinessState={readiness}
          formState={form.formState}
          isSubmitting={mutation.isPending}
          
          // Funcionalidades avanzadas
          canSubmit={() => form.formState.isValid && !mutation.isPending}
          onDisabledSubmitAttempt={(reason) => {
            toast({ title: 'No se puede enviar', description: reason });
          }}
          showValidationErrors={true}
          preventEnterSubmit={false}
        />
      }
      
      onClose={handleClose}
      onSubmit={form.handleSubmit(onSubmit)}
    >
      {/* Contenido envuelto en LoadingGate */}
      <readiness.LoadingGate>
        <Form {...form}>
          {/* Formulario aquí */}
        </Form>
      </readiness.LoadingGate>
    </FormModalLayout>
  );
};

// ✅ PATRÓN: Modal de Vista/Edición
export const ViewEditModalPattern = () => {
  const [isEditing, setIsEditing] = useState(false);
  const readiness = useModalReadiness(/* ... */);

  return (
    <FormModalLayout
      isEditing={isEditing}
      readinessState={readiness}
      
      viewPanel={<ContactView contact={contact} />}
      editPanel={<ContactEditForm contact={contact} />}
      
      headerContent={
        <FormModalHeader
          title={isEditing ? 'Editar Contacto' : 'Ver Contacto'}
          icon={User}
          readinessState={readiness}
          isEditing={isEditing}
          onToggleEdit={() => setIsEditing(!isEditing)}
        />
      }
      
      footerContent={
        isEditing ? (
          <FormModalFooter
            cancelText="Cancelar"
            submitText="Guardar Cambios"
            onSubmit={handleSave}
            readinessState={readiness}
          />
        ) : (
          <FormModalFooter
            submitText="Editar"
            onSubmit={() => setIsEditing(true)}
          />
        )
      }
    />
  );
};

// =====================================================
// 4. ⌨️ KEYBOARD & ACCESSIBILITY
// =====================================================

/**
 * MEJORES PRÁCTICAS DE ACCESSIBILITY
 */

// ✅ PATRÓN: Modal Completamente Accesible
export const AccessibleModalPattern = () => {
  const readiness = useModalReadiness(/* ... */);

  return (
    <FormModalLayout
      readinessState={readiness}
      
      // Accessibility props
      modalId="contact-form-modal"
      ariaLabel="Formulario de nuevo contacto"
      ariaDescription="Completa este formulario para agregar un nuevo contacto a tu organización"
      
      // Focus management
      autoFocusFirstInput={true}
      trapFocus={true}
      
      // Keyboard behavior
      preventEscapeClose={false}
      preventClickOutsideClose={false}
      
      // Unsaved changes protection
      hasUnsavedChanges={form.formState.isDirty}
      canClose={() => !form.formState.isDirty || confirm('¿Descartar cambios?')}
      
      headerContent={
        <FormModalHeader
          title="Nuevo Contacto"
          headingLevel={1} // h1 para modal principal
          headerId="contact-form-title"
          
          // Keyboard shortcuts
          keyboardActions={[
            {
              key: 's',
              modifiers: ['ctrl'],
              label: 'Guardar',
              action: () => form.handleSubmit(onSubmit)(),
            },
            {
              key: 'e',
              modifiers: ['ctrl'],
              label: 'Alternar edición',
              action: () => setIsEditing(!isEditing),
            },
          ]}
          showKeyboardShortcuts={true}
        />
      }
    />
  );
};

// 🔥 SHORTCUTS ESTÁNDAR RECOMENDADOS
export const STANDARD_KEYBOARD_SHORTCUTS = {
  // Navegación
  ESCAPE: 'Cerrar modal',
  ENTER: 'Submit formulario (cuando corresponda)',
  TAB: 'Navegar entre elementos (trap focus)',
  
  // Acciones comunes
  'Ctrl+S': 'Guardar/Submit',
  'Ctrl+E': 'Alternar modo edición',
  'Ctrl+Shift+D': 'Eliminar (con confirmación)',
  'Ctrl+Z': 'Deshacer (si aplica)',
  
  // Navegación avanzada
  'Ctrl+1': 'Ir al primer paso/panel',
  'Ctrl+2': 'Ir al segundo paso/panel',
  'Ctrl+ArrowLeft': 'Paso anterior',
  'Ctrl+ArrowRight': 'Paso siguiente',
};

// =====================================================
// 5. 🔄 LOADING STATES
// =====================================================

/**
 * MANEJO CONSISTENTE DE LOADING STATES
 */

// ✅ PATRÓN: Loading States Jerárquicos
export const LoadingStatesPattern = () => {
  const readiness = useModalReadiness(/* ... */);
  const inputStates = useModalInputStates(readiness, mutation.isPending);

  return (
    <FormModalLayout readinessState={readiness}>
      <readiness.LoadingGate>
        {/* Nivel 1: Modal ready, mostrar contenido */}
        <Form {...form}>
          <Input 
            {...inputStates.inputProps} // Auto-disabled durante loading
            placeholder="Nombre"
          />
          
          <Button {...inputStates.buttonProps}>
            {inputStates.showSpinner && <Loader2 className="animate-spin" />}
            Acción
          </Button>
        </Form>
      </readiness.LoadingGate>
    </FormModalLayout>
  );
};

// 🔥 TIPOS DE LOADING A MANEJAR
export const LOADING_STATE_TYPES = {
  // 1. Modal readiness loading (datos iniciales)
  MODAL_READINESS: 'Cargando datos del modal...',
  
  // 2. Form submission loading (mutaciones)
  FORM_SUBMISSION: 'Guardando...',
  
  // 3. Secondary data loading (datos opcionales)
  SECONDARY_DATA: 'Cargando información adicional...',
  
  // 4. File upload loading
  FILE_UPLOAD: 'Subiendo archivos...',
  
  // 5. Validation loading (validaciones async)
  VALIDATION: 'Validando...',
};

// =====================================================
// 6. ❌ ERROR HANDLING
// =====================================================

/**
 * ERROR BOUNDARIES Y RECOVERY
 */

// ✅ PATRÓN: Error Handling Completo
export const ErrorHandlingPattern = () => {
  const readiness = useModalReadiness({
    criticalQueries: [/* ... */],
    onError: (error) => {
      // Log error para debugging
      
      // Reportar a servicio de monitoreo
      // Sentry.captureException(error);
    },
  });

  return (
    <ModalErrorBoundary
      onClose={onClose}
      fallbackTitle="Error en el Modal"
      onError={(error, errorInfo) => {
        // Log completo del error
      }}
    >
      <FormModalLayout readinessState={readiness}>
        {/* Contenido del modal */}
      </FormModalLayout>
    </ModalErrorBoundary>
  );
};

// 🔥 TIPOS DE ERRORES A MANEJAR
export const ERROR_TYPES = {
  // 1. Errores de carga inicial
  READINESS_ERROR: 'Error al cargar datos necesarios',
  
  // 2. Errores de validación
  VALIDATION_ERROR: 'Datos inválidos',
  
  // 3. Errores de red/API
  NETWORK_ERROR: 'Error de conexión',
  
  // 4. Errores de autorización
  AUTH_ERROR: 'No autorizado',
  
  // 5. Errores de renderizado (capturados por boundary)
  RENDER_ERROR: 'Error interno del modal',
};

// =====================================================
// 7. 📝 FORM PATTERNS
// =====================================================

/**
 * PATRONES PARA FORMULARIOS
 */

// ✅ PATRÓN: Formulario con Validación Robusta
export const RobustFormPattern = () => {
  const form = useForm({
    resolver: zodResolver(schema),
    defaultValues: {},
  });

  const readiness = useModalReadiness(/* ... */);
  
  const mutation = useMutation({
    mutationFn: async (data) => {
      // Validación final antes de enviar
      const isValid = await form.trigger();
      if (!isValid) {
        throw new Error('Formulario inválido');
      }
      
      return submitData(data);
    },
    onError: (error) => {
      toast({
        title: 'Error al guardar',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  return (
    <FormModalLayout
      readinessState={readiness}
      onSubmit={form.handleSubmit((data) => mutation.mutate(data))}
      hasUnsavedChanges={form.formState.isDirty}
      
      footerContent={
        <FormModalFooter
          readinessState={readiness}
          formState={form.formState}
          isSubmitting={mutation.isPending}
          
          // Validación custom adicional
          canSubmit={() => {
            return form.formState.isValid && 
                   !mutation.isPending && 
                   form.formState.isDirty;
          }}
          
          onSubmit={form.handleSubmit((data) => mutation.mutate(data))}
          showValidationErrors={true}
        />
      }
    >
      <readiness.LoadingGate>
        <Form {...form}>
          {/* Campos del formulario */}
        </Form>
      </readiness.LoadingGate>
    </FormModalLayout>
  );
};

// =====================================================
// 8. 🎛️ ADVANCED FEATURES
// =====================================================

/**
 * FUNCIONALIDADES AVANZADAS
 */

// ✅ PATRÓN: Modal Multi-Step
export const MultiStepModalPattern = () => {
  const [currentStep, setCurrentStep] = useState(1);
  const totalSteps = 3;
  const readiness = useModalReadiness(/* ... */);

  return (
    <FormModalLayout
      readinessState={readiness}
      
      headerContent={
        <FormModalHeader
          title={`Paso ${currentStep}: ${stepTitles[currentStep]}`}
          progress={{
            current: currentStep,
            total: totalSteps,
            showNumbers: true,
            showPercentage: true,
          }}
          
          showBackButton={currentStep > 1}
          onBackClick={() => setCurrentStep(currentStep - 1)}
        />
      }
      
      footerContent={
        <FormModalFooter
          leftLabel={currentStep > 1 ? 'Anterior' : 'Cancelar'}
          onLeftClick={() => {
            if (currentStep > 1) {
              setCurrentStep(currentStep - 1);
            } else {
              onClose();
            }
          }}
          
          rightLabel={currentStep === totalSteps ? 'Finalizar' : 'Siguiente'}
          onRightClick={() => {
            if (currentStep === totalSteps) {
              handleSubmit();
            } else {
              setCurrentStep(currentStep + 1);
            }
          }}
          
          readinessState={readiness}
        />
      }
    >
      <readiness.LoadingGate>
        {getStepContent(currentStep)}
      </readiness.LoadingGate>
    </FormModalLayout>
  );
};

// =====================================================
// 9. 🧪 TESTING PATTERNS
// =====================================================

/**
 * CÓMO TESTEAR MODALES
 */

// ✅ PATRÓN: Testing Comprehensivo
export const TESTING_GUIDELINES = {
  // 1. Test de readiness states
  'should show loading state when data is not ready': async () => {
    render(<ExampleModal />);
    expect(screen.getByText('Cargando...')).toBeInTheDocument();
  },

  // 2. Test de keyboard shortcuts
  'should submit form when pressing Ctrl+S': async () => {
    render(<ExampleModal />);
    await userEvent.keyboard('{Control>}s{/Control}');
    expect(mockSubmit).toHaveBeenCalled();
  },

  // 3. Test de error boundaries
  'should show error boundary when component crashes': async () => {
    const ThrowError = () => { throw new Error('Test error'); };
    render(
      <ModalErrorBoundary onClose={jest.fn()}>
        <ThrowError />
      </ModalErrorBoundary>
    );
    expect(screen.getByText('Error en el Modal')).toBeInTheDocument();
  },

  // 4. Test de accessibility
  'should have proper ARIA attributes': async () => {
    render(<ExampleModal />);
    const modal = screen.getByRole('dialog');
    expect(modal).toHaveAttribute('aria-modal', 'true');
    expect(modal).toHaveAttribute('aria-labelledby');
  },
};

// =====================================================
// 10. 📊 EXAMPLES
// =====================================================

/**
 * EJEMPLO COMPLETO: Modal de Contacto Perfecto
 */
export const PerfectContactModal = ({ contactId, onClose }) => {
  const { data: userData } = useCurrentUser();
  const { data: contact } = useContact(contactId);
  const { data: contactTypes } = useContactTypes();
  
  const readiness = useModalReadiness({
    criticalQueries: [
      useCurrentUser(),
      useContact(contactId),
    ],
    optionalQueries: [
      useContactTypes(),
    ],
    requiredIds: {
      organizationId: userData?.organization?.id,
      ...(contactId && { contactId }),
    },
  });

  const form = useForm({
    resolver: zodResolver(contactSchema),
    defaultValues: contact || {},
  });

  const mutation = useMutation({
    mutationFn: contactId ? updateContact : createContact,
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ORGANIZATION_SCOPED_QUERIES.contacts(userData.organization.id)
      });
      toast({ title: 'Contacto guardado exitosamente' });
      onClose();
    },
  });

  return (
    <ModalErrorBoundary onClose={onClose}>
      <FormModalLayout
        readinessState={readiness}
        wide={true}
        
        modalId="contact-form-modal"
        ariaLabel={contactId ? 'Editar contacto' : 'Nuevo contacto'}
        
        autoFocusFirstInput={true}
        hasUnsavedChanges={form.formState.isDirty}
        
        onSubmit={form.handleSubmit((data) => mutation.mutate(data))}
        onClose={onClose}
        
        headerContent={
          <FormModalHeader
            title={contactId ? 'Editar Contacto' : 'Nuevo Contacto'}
            description="Gestiona la información de contacto"
            icon={UserPlus}
            readinessState={readiness}
            
            keyboardActions={[
              {
                key: 's',
                modifiers: ['ctrl'],
                label: 'Guardar',
                action: () => form.handleSubmit((data) => mutation.mutate(data))(),
              },
            ]}
          />
        }
        
        footerContent={
          <FormModalFooter
            cancelText="Cancelar"
            submitText={contactId ? 'Actualizar' : 'Crear'}
            
            readinessState={readiness}
            formState={form.formState}
            isSubmitting={mutation.isPending}
            
            onSubmit={form.handleSubmit((data) => mutation.mutate(data))}
            onLeftClick={onClose}
            
            showValidationErrors={true}
            loadingText={contactId ? 'Actualizando...' : 'Creando...'}
          />
        }
      >
        <readiness.LoadingGate>
          <Form {...form}>
            {/* Campos del formulario */}
            <ContactFormFields />
          </Form>
        </readiness.LoadingGate>
      </FormModalLayout>
    </ModalErrorBoundary>
  );
};

// =====================================================
// 🎉 CHECKLIST FINAL
// =====================================================

/**
 * ✅ CHECKLIST: Modal Perfecto
 * 
 * Antes de considerar un modal "completo", verifica:
 * 
 * □ Usa useModalReadiness para datos críticos
 * □ Tiene query keys con scope apropiado (org/project)
 * □ Está envuelto en ModalErrorBoundary
 * □ Usa FormModalLayout con props correctas
 * □ Tiene FormModalHeader con accessibility
 * □ Tiene FormModalFooter con canSubmit robusto
 * □ Maneja keyboard shortcuts (Enter, Esc, etc)
 * □ Tiene proper focus management
 * □ Protege contra cambios sin guardar
 * □ Muestra loading states consistentes
 * □ Tiene error handling apropiado
 * □ Está probado con casos edge
 * □ Cumple estándares de accessibility (ARIA, etc)
 * □ Tiene data-testid para testing
 * □ Invalidates cache correctamente después de mutations
 * 
 * 🎯 Si tu modal cumple todos estos puntos, ¡está perfecto!
 */

// =====================================================
// 📚 EXPORTS PARA USO EN MODALES
// =====================================================

export {
  // Readiness patterns
  useModalReadiness,
  buildScopedQueryKey,
  QUERY_KEY_PATTERNS,
  
  // Error handling
  ModalErrorBoundary,
  
  // Layout components
  FormModalLayout,
  FormModalHeader,
  FormModalFooter,
  
  // Query key patterns
  ORGANIZATION_SCOPED_QUERIES,
  PROJECT_SCOPED_QUERIES,
  GLOBAL_QUERIES,
  
  // Standards
  STANDARD_KEYBOARD_SHORTCUTS,
  LOADING_STATE_TYPES,
  ERROR_TYPES,
};

/**
 * 🎯 MISIÓN COMPLETADA
 * 
 * Esta infraestructura proporciona:
 * ✅ Patrón de readiness estándar implementado
 * ✅ FormModalFooter con canSubmit robusto y prevención double-submit  
 * ✅ FormModalLayout con mejor onSubmit y ENTER key support
 * ✅ ModalErrorBoundary para manejo elegante de errores
 * ✅ Documentación completa de mejores prácticas
 * 
 * Todos los modales futuros pueden usar estos patrones para:
 * - Consistent loading states
 * - Robust error handling  
 * - Perfect accessibility
 * - Keyboard shortcuts
 * - Proper cache invalidation
 * - Comprehensive testing
 * 
 * 🚀 La infraestructura está lista para producción!
 */