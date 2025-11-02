import type { Express } from "express";
import type { RouteDeps } from "./_base";
import type { SupabaseClient } from "@supabase/supabase-js";
import OpenAI from "openai";

interface Suggestion {
  label: string;
  action: string;
}

interface GreetingResponse {
  greeting: string;
  suggestions: Suggestion[];
}

interface UsageLimitCheck {
  allowed: boolean;
  message?: string;
  remainingPrompts?: number;
}

/**
 * Verifica y gestiona los límites de uso de IA por usuario
 * - free: 3 prompts/día
 * - pro/teams: ilimitado
 * 
 * IMPORTANTE: Llamar DESPUÉS de validar el request para evitar consumo de quota con requests malformados
 */
async function checkAndIncrementUsageLimit(
  userId: string,
  supabase: SupabaseClient
): Promise<UsageLimitCheck> {
  try {
    // 1. Obtener o crear registro de límites
    let { data: usageLimits, error: fetchError } = await supabase
      .from('ia_user_usage_limits')
      .select('*')
      .eq('user_id', userId)
      .single();

    // Si no existe, crear con valores default (plan='free', daily_limit=3)
    if (fetchError || !usageLimits) {
      const { data: newRecord, error: insertError } = await supabase
        .from('ia_user_usage_limits')
        .insert({ user_id: userId })
        .select()
        .single();

      if (insertError || !newRecord) {
        console.error('Error creating usage limits:', insertError);
        // Fail-closed: rechazar en caso de error para evitar bypass de límites
        return { 
          allowed: false, 
          message: "Error verificando límites de uso. Por favor intenta nuevamente." 
        };
      }

      usageLimits = newRecord;
    }

    const plan = usageLimits.plan || 'free';
    
    // 2. Planes PRO y TEAMS tienen acceso ilimitado
    if (plan === 'pro' || plan === 'teams') {
      // Actualizar last_prompt_at pero NO incrementar contador
      await supabase
        .from('ia_user_usage_limits')
        .update({ last_prompt_at: new Date().toISOString() })
        .eq('user_id', userId);

      return { allowed: true, remainingPrompts: -1 }; // -1 = ilimitado
    }

    // 3. Plan FREE: verificar límite diario
    const currentUsage = usageLimits.prompts_used_today || 0;
    const dailyLimit = usageLimits.daily_limit || 3;

    if (currentUsage >= dailyLimit) {
      return {
        allowed: false,
        message: `Has alcanzado tu límite diario de ${dailyLimit} prompts. Actualiza a PRO para acceso ilimitado.`,
        remainingPrompts: 0
      };
    }

    // 4. Incrementar contador de forma atómica usando UPDATE condicional
    // Esto previene race conditions donde múltiples requests concurrentes sobrepasen el límite
    const { data: updatedData, error: updateError } = await supabase
      .from('ia_user_usage_limits')
      .update({
        prompts_used_today: currentUsage + 1,
        last_prompt_at: new Date().toISOString()
      })
      .eq('user_id', userId)
      .lt('prompts_used_today', dailyLimit) // Solo actualizar si aún está bajo el límite
      .select()
      .single();

    // Si el update falló porque ya se alcanzó el límite en otro request concurrente
    if (updateError || !updatedData) {
      return {
        allowed: false,
        message: `Has alcanzado tu límite diario de ${dailyLimit} prompts. Actualiza a PRO para acceso ilimitado.`,
        remainingPrompts: 0
      };
    }

    return {
      allowed: true,
      remainingPrompts: dailyLimit - currentUsage - 1
    };

  } catch (err) {
    console.error('Error in checkAndIncrementUsageLimit:', err);
    // Fail-closed: rechazar en caso de error para prevenir bypass de límites
    return { 
      allowed: false, 
      message: "Error verificando límites de uso. Por favor intenta nuevamente." 
    };
  }
}

export function registerAIRoutes(app: Express, deps: RouteDeps) {
  const { supabase, createAuthenticatedClient, extractToken } = deps;

  // GET /api/ai/home_greeting - AI-powered home greeting with suggestions
  app.get("/api/ai/home_greeting", async (req, res) => {
    try {
      const openaiApiKey = process.env.OPENAI_API_KEY;

      if (!openaiApiKey) {
        return res.status(500).json({ error: "Missing OpenAI API key" });
      }

      // Extraer token y autenticar
      const token = extractToken(req.headers.authorization);
      if (!token) {
        return res.status(401).json({ error: "No authorization token provided" });
      }

      const authenticatedSupabase = createAuthenticatedClient(token);

      // Obtener el usuario autenticado
      const { data: { user }, error: authError } = await authenticatedSupabase.auth.getUser();
      if (authError || !user) {
        return res.status(401).json({ error: "Unauthorized" });
      }

      // Obtener el usuario de la tabla users por auth_id
      const { data: dbUser } = await authenticatedSupabase
        .from('users')
        .select('id')
        .eq('auth_id', user.id)
        .single();

      if (!dbUser) {
        return res.status(404).json({ error: "User not found in database" });
      }

      const userId = dbUser.id;

      // ========================================
      // 0. VERIFICAR LÍMITES DE USO
      // ========================================
      const limitCheck = await checkAndIncrementUsageLimit(userId, authenticatedSupabase);
      
      if (!limitCheck.allowed) {
        return res.status(429).json({ 
          error: limitCheck.message,
          limitReached: true,
          remainingPrompts: 0
        });
      }

      // ========================================
      // 1. OBTENER DATOS DEL USUARIO
      // ========================================
      const { data: userData, error: userError } = await authenticatedSupabase
        .from('users')
        .select('full_name')
        .eq('id', userId)
        .single();

      if (userError || !userData) {
        return res.status(404).json({ error: "User not found" });
      }

      // Obtener preferencias de IA del usuario
      const { data: preferences } = await authenticatedSupabase
        .from('ia_user_preferences')
        .select('display_name, tone, language')
        .eq('user_id', userId)
        .single();

      // Obtener la organización actual del usuario
      const { data: userPrefs } = await authenticatedSupabase
        .from('user_preferences')
        .select('last_organization_id')
        .eq('user_id', userId)
        .single();

      const organizationId = userPrefs?.last_organization_id;

      // Valores por defecto
      const displayName = preferences?.display_name || userData.full_name || "Usuario";
      const tone = preferences?.tone || "amistoso";
      const language = preferences?.language || "es";

      // ========================================
      // 2. OBTENER CONTEXTO DEL USUARIO
      // ========================================
      
      // 2.1 Últimos cursos en progreso (con progreso reciente)
      const { data: coursesInProgress } = await authenticatedSupabase
        .from('payments')
        .select(`
          course_id,
          courses:course_id (
            id,
            title,
            slug
          )
        `)
        .eq('user_id', userId)
        .eq('status', 'approved')
        .not('course_id', 'is', null)
        .order('approved_at', { ascending: false })
        .limit(3);

      // 2.2 Última lección vista (progreso más reciente)
      const { data: recentProgress } = await authenticatedSupabase
        .from('course_lesson_progress')
        .select(`
          lesson_id,
          progress_pct,
          last_position_sec,
          updated_at,
          course_lessons:lesson_id (
            id,
            title,
            module_id,
            course_modules:module_id (
              course_id,
              courses:course_id (
                id,
                title,
                slug
              )
            )
          )
        `)
        .eq('user_id', userId)
        .order('updated_at', { ascending: false })
        .limit(1);

      // 2.3 Proyectos activos de la organización
      const { data: activeProjects } = organizationId ? await authenticatedSupabase
        .from('projects')
        .select('id, name, status')
        .eq('organization_id', organizationId)
        .eq('status', 'active')
        .order('created_at', { ascending: false })
        .limit(3) : { data: null };

      // 2.4 Últimos presupuestos
      const { data: recentBudgets } = organizationId ? await authenticatedSupabase
        .from('budgets')
        .select(`
          id,
          name,
          status,
          updated_at,
          projects:project_id (
            id,
            name
          )
        `)
        .eq('organization_id', organizationId)
        .order('updated_at', { ascending: false })
        .limit(2) : { data: null };

      // ========================================
      // 3. CONSTRUIR CONTEXTO PARA GPT
      // ========================================
      
      const today = new Date().toLocaleDateString(language === 'es' ? 'es-ES' : 'en-US', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });

      let contextString = `Hoy es ${today}. El usuario se llama ${displayName}.`;

      // Agregar información de cursos en progreso
      if (coursesInProgress && coursesInProgress.length > 0) {
        const courseNames = coursesInProgress
          .filter((p: any) => p.courses?.title)
          .map((p: any) => p.courses.title)
          .join(', ');
        if (courseNames) {
          contextString += ` Tiene acceso a los cursos: ${courseNames}.`;
        }
      }

      // Agregar última lección vista
      if (recentProgress && recentProgress.length > 0 && recentProgress[0]?.course_lessons) {
        const lesson = recentProgress[0].course_lessons as any;
        const progressPct = parseFloat(recentProgress[0].progress_pct as any) || 0;
        
        if (lesson?.course_modules?.courses?.title && lesson.title) {
          const courseTitle = lesson.course_modules.courses.title;
          const lessonTitle = lesson.title;
          contextString += ` Su última lección vista fue "${lessonTitle}" del curso "${courseTitle}" (progreso: ${progressPct.toFixed(0)}%).`;
        }
      }

      // Agregar proyectos activos
      if (activeProjects && activeProjects.length > 0) {
        const projectNames = activeProjects.map((p: any) => p.name).join(', ');
        contextString += ` Tiene ${activeProjects.length} proyecto${activeProjects.length > 1 ? 's' : ''} activo${activeProjects.length > 1 ? 's' : ''}: ${projectNames}.`;
      }

      // Agregar presupuestos recientes
      if (recentBudgets && recentBudgets.length > 0) {
        const budget = recentBudgets[0] as any;
        const project = Array.isArray(budget?.projects) ? budget.projects[0] : budget?.projects;
        if (project?.name) {
          contextString += ` Su último presupuesto editado fue "${budget.name}" del proyecto "${project.name}".`;
        }
      }

      // ========================================
      // 4. LLAMAR A GPT-4o
      // ========================================
      
      const openai = new OpenAI({
        apiKey: openaiApiKey,
      });

      const systemPrompt = language === 'es' 
        ? `Sos Archubita, la asistente virtual personalizada de Archub, una plataforma de gestión de construcción y arquitectura.

Tu trabajo es:
1. Saludar cálidamente al usuario con tono ${tone}
2. Recomendar 2 o 3 acciones útiles basadas en su contexto (cursos en progreso, proyectos activos, presupuestos, etc.)

Devolvé tu respuesta en formato JSON exactamente así:
{
  "greeting": "¡Buen día Mati! 👋 Hoy es jueves...",
  "suggestions": [
    { "label": "Continuar curso 'Modelado BIM'", "action": "/learning/courses/modelado-bim" },
    { "label": "Ver presupuesto de Casa PH", "action": "/project/dashboard" },
    { "label": "Revisar proyectos activos", "action": "/organization/projects" }
  ]
}

Reglas:
- El greeting debe ser breve, cálido y personalizado (máx 2-3 oraciones)
- Las suggestions deben ser relevantes al contexto del usuario
- Las action URLs deben ser rutas válidas en Archub
- Si no hay datos suficientes, sugerí acciones generales como explorar cursos o crear un proyecto
- SIEMPRE devolvé JSON válido, sin texto adicional`
        : `You are Archubita, the personalized AI assistant for Archub, a construction and architecture management platform.

Your job is:
1. Warmly greet the user with a ${tone} tone
2. Recommend 2-3 useful actions based on their context (courses in progress, active projects, budgets, etc.)

Return your response in JSON format exactly like this:
{
  "greeting": "Good morning Mati! 👋 Today is Thursday...",
  "suggestions": [
    { "label": "Continue 'BIM Modeling' course", "action": "/learning/courses/bim-modeling" },
    { "label": "View PH House budget", "action": "/project/dashboard" },
    { "label": "Review active projects", "action": "/organization/projects" }
  ]
}

Rules:
- The greeting should be brief, warm, and personalized (max 2-3 sentences)
- The suggestions should be relevant to the user's context
- The action URLs should be valid Archub routes
- If there's insufficient data, suggest general actions like exploring courses or creating a project
- ALWAYS return valid JSON, no additional text`;

      const completion = await openai.chat.completions.create({
        model: "gpt-4o",
        messages: [
          {
            role: "system",
            content: systemPrompt
          },
          {
            role: "user",
            content: contextString
          }
        ],
        response_format: { type: "json_object" }
      });

      const responseContent = completion.choices[0]?.message?.content || "{}";
      const usage = completion.usage;

      let greetingResponse: GreetingResponse;
      
      try {
        greetingResponse = JSON.parse(responseContent);
        
        // Validar que tenga la estructura esperada
        if (!greetingResponse.greeting || !Array.isArray(greetingResponse.suggestions)) {
          throw new Error("Invalid response structure");
        }
      } catch (parseError) {
        console.error('Error parsing GPT response:', parseError);
        // Fallback si la respuesta no es JSON válido
        greetingResponse = {
          greeting: `¡Hola, ${displayName}! ¿Cómo estás hoy?`,
          suggestions: [
            { label: "Explorar cursos", action: "/learning/courses" },
            { label: "Ver proyectos", action: "/organization/projects" },
            { label: "Ir a inicio", action: "/home" }
          ]
        };
      }

      // ========================================
      // 5. REGISTRAR EN TABLAS DE IA (sin bloquear)
      // ========================================
      
      const promptTokens = usage?.prompt_tokens || 0;
      const completionTokens = usage?.completion_tokens || 0;
      const totalTokens = usage?.total_tokens || 0;
      const costUsd = ((promptTokens * 5) / 1000000) + ((completionTokens * 15) / 1000000);

      // Guardar el mensaje (no bloqueante)
      authenticatedSupabase
        .from('ia_messages')
        .insert({
          user_id: userId,
          role: 'assistant',
          content: greetingResponse.greeting,
          context_type: 'home_greeting'
        })
        .then(({ error }) => {
          if (error) console.error('Error saving message:', error);
        });

      // Registrar el uso (no bloqueante)
      authenticatedSupabase
        .from('ia_usage_logs')
        .insert({
          user_id: userId,
          model: 'gpt-4o',
          provider: 'openai',
          prompt_tokens: promptTokens,
          completion_tokens: completionTokens,
          total_tokens: totalTokens,
          cost_usd: costUsd,
          context_type: 'home_greeting'
        })
        .then(({ error }) => {
          if (error) console.error('Error logging usage:', error);
        });

      // ========================================
      // 6. DEVOLVER RESPUESTA
      // ========================================
      
      return res.status(200).json(greetingResponse);

    } catch (err: any) {
      console.error('Error in home_greeting:', err);
      
      // Fallback en caso de error
      return res.status(200).json({
        greeting: "¡Hola! ¿Cómo estás hoy?",
        suggestions: [
          { label: "Explorar cursos", action: "/learning/courses" },
          { label: "Ver proyectos", action: "/organization/projects" }
        ]
      });
    }
  });

  // POST /api/ai/chat - Conversational AI chat
  app.post("/api/ai/chat", async (req, res) => {
    try {
      const openaiApiKey = process.env.OPENAI_API_KEY;

      if (!openaiApiKey) {
        return res.status(500).json({ error: "Missing OpenAI API key" });
      }

      // Extraer token y autenticar
      const token = extractToken(req.headers.authorization);
      if (!token) {
        return res.status(401).json({ error: "No authorization token provided" });
      }

      const authenticatedSupabase = createAuthenticatedClient(token);

      // Obtener el usuario autenticado
      const { data: { user }, error: authError } = await authenticatedSupabase.auth.getUser();
      if (authError || !user) {
        return res.status(401).json({ error: "Unauthorized" });
      }

      // Obtener el usuario de la tabla users por auth_id
      const { data: dbUser } = await authenticatedSupabase
        .from('users')
        .select('id')
        .eq('auth_id', user.id)
        .single();

      if (!dbUser) {
        return res.status(404).json({ error: "User not found in database" });
      }

      const userId = dbUser.id;

      // Obtener el mensaje y el historial del body
      const { message, history = [] } = req.body;

      if (!message || typeof message !== 'string') {
        return res.status(400).json({ error: "Message is required" });
      }

      // ========================================
      // 0. VERIFICAR LÍMITES DE USO (después de validar request)
      // ========================================
      const limitCheck = await checkAndIncrementUsageLimit(userId, authenticatedSupabase);
      
      if (!limitCheck.allowed) {
        return res.status(429).json({ 
          error: limitCheck.message,
          limitReached: true,
          remainingPrompts: 0
        });
      }

      // Obtener datos del usuario para contexto
      const { data: userData } = await authenticatedSupabase
        .from('users')
        .select('full_name')
        .eq('id', userId)
        .single();

      const { data: preferences } = await authenticatedSupabase
        .from('ia_user_preferences')
        .select('display_name, tone, language')
        .eq('user_id', userId)
        .single();

      const displayName = preferences?.display_name || userData?.full_name || "Usuario";
      const tone = preferences?.tone || "amistoso";
      const language = preferences?.language || "es";

      // Construir el historial de mensajes para GPT
      const messages = [
        {
          role: "system" as const,
          content: language === 'es'
            ? `Sos un asistente virtual de Archub, una plataforma de gestión de construcción y arquitectura. 
Tu nombre es Archub AI. Ayudás a ${displayName} con sus proyectos, cursos, presupuestos y cualquier pregunta relacionada con la plataforma.
Mantené un tono ${tone} y respondé de forma concisa y útil.`
            : `You are an AI assistant for Archub, a construction and architecture management platform.
Your name is Archub AI. You help ${displayName} with their projects, courses, budgets, and any platform-related questions.
Maintain a ${tone} tone and respond concisely and helpfully.`
        },
        // Agregar historial previo
        ...history.map((msg: any) => ({
          role: msg.role === 'user' ? 'user' as const : 'assistant' as const,
          content: msg.content
        })),
        // Agregar el mensaje actual del usuario
        {
          role: "user" as const,
          content: message
        }
      ];

      // Obtener organization_id para function calling
      const { data: userPrefs } = await authenticatedSupabase
        .from('user_preferences')
        .select('last_organization_id')
        .eq('user_id', userId)
        .single();

      const organizationId = userPrefs?.last_organization_id;

      // Llamar a GPT-4o
      const openai = new OpenAI({
        apiKey: openaiApiKey,
      });

      const completion = await openai.chat.completions.create({
        model: "gpt-4o",
        messages: messages,
        temperature: 0.7,
        max_tokens: 500,
        tools: [
          // 1. getTotalPaymentsByContactAndProject (ya existe)
          {
            type: "function" as const,
            function: {
              name: "getTotalPaymentsByContactAndProject",
              description: "Calcula el total de pagos realizados a un contacto específico en un proyecto. Útil para responder preguntas como '¿Cuánto le pagué a X en el proyecto Y?'",
              parameters: {
                type: "object",
                properties: {
                  contactName: {
                    type: "string",
                    description: "Nombre del contacto (puede ser socio, subcontratista, empleado, cliente, etc.)"
                  },
                  projectName: {
                    type: "string",
                    description: "Nombre del proyecto"
                  }
                },
                required: ["contactName", "projectName"]
              }
            }
          },
          
          // 2. getOrganizationBalance (NUEVA)
          {
            type: "function" as const,
            function: {
              name: "getOrganizationBalance",
              description: "Calcula el balance general de la organización (ingresos totales - egresos totales). Puede filtrar por moneda específica o convertir todo a una moneda. Útil para '¿Cuál es mi balance actual?' o '¿Cuánto tengo en total?'",
              parameters: {
                type: "object",
                properties: {
                  currency: {
                    type: "string",
                    description: "Código de moneda para filtrar (ej: 'ARS', 'USD'). Opcional."
                  },
                  convertTo: {
                    type: "string",
                    description: "Código de moneda a la que convertir todos los montos. Opcional."
                  }
                },
                required: []
              }
            }
          },
          
          // 3. getProjectFinancialSummary (NUEVA)
          {
            type: "function" as const,
            function: {
              name: "getProjectFinancialSummary",
              description: "Obtiene un resumen financiero completo de un proyecto: balance, ingresos totales, egresos totales, y opcionalmente un desglose por categorías. Útil para '¿Cuál es el balance de Casa Blanca?' o 'Dame el resumen financiero del proyecto X'",
              parameters: {
                type: "object",
                properties: {
                  projectName: {
                    type: "string",
                    description: "Nombre del proyecto"
                  },
                  includeBreakdown: {
                    type: "boolean",
                    description: "Si es true, incluye desglose de las top 3 categorías de gasto. Default: false"
                  }
                },
                required: ["projectName"]
              }
            }
          },
          
          // 4. getRoleSpending (NUEVA)
          {
            type: "function" as const,
            function: {
              name: "getRoleSpending",
              description: "Calcula gastos totales por rol (subcontratistas, personal, socios). Puede filtrar por proyecto, rango de fechas y moneda. Útil para '¿Cuánto gasté en subcontratistas este mes?' o '¿Cuánto le pagué a mi personal?'",
              parameters: {
                type: "object",
                properties: {
                  role: {
                    type: "string",
                    enum: ["subcontractor", "personnel", "partner"],
                    description: "Rol a consultar: 'subcontractor' (subcontratistas), 'personnel' (personal/empleados), 'partner' (socios)"
                  },
                  projectName: {
                    type: "string",
                    description: "Nombre del proyecto para filtrar. Opcional."
                  },
                  dateRange: {
                    type: "object",
                    properties: {
                      start: { type: "string", description: "Fecha inicio (YYYY-MM-DD)" },
                      end: { type: "string", description: "Fecha fin (YYYY-MM-DD)" }
                    },
                    description: "Rango de fechas. Opcional."
                  },
                  currency: {
                    type: "string",
                    description: "Código de moneda para filtrar. Opcional."
                  }
                },
                required: ["role"]
              }
            }
          },
          
          // 5. getContactMovements (NUEVA)
          {
            type: "function" as const,
            function: {
              name: "getContactMovements",
              description: "Obtiene TODOS los movimientos (ingresos y egresos) de un contacto específico, con balance neto. Más completo que getTotalPaymentsByContactAndProject. Puede filtrar por proyecto, fechas, moneda o convertir. Útil para '¿Cuánto movimiento tuvo Juan en total?' o 'Balance de María en Casa Blanca'",
              parameters: {
                type: "object",
                properties: {
                  contactName: {
                    type: "string",
                    description: "Nombre del contacto"
                  },
                  projectName: {
                    type: "string",
                    description: "Nombre del proyecto. Opcional."
                  },
                  dateRange: {
                    type: "object",
                    properties: {
                      start: { type: "string", description: "Fecha inicio (YYYY-MM-DD)" },
                      end: { type: "string", description: "Fecha fin (YYYY-MM-DD)" }
                    },
                    description: "Rango de fechas. Opcional."
                  },
                  currency: {
                    type: "string",
                    description: "Código de moneda para filtrar. Opcional."
                  },
                  convertTo: {
                    type: "string",
                    description: "Código de moneda a la que convertir. Opcional."
                  }
                },
                required: ["contactName"]
              }
            }
          },
          
          // 6. getDateRangeMovements (NUEVA)
          {
            type: "function" as const,
            function: {
              name: "getDateRangeMovements",
              description: "Obtiene movimientos en un rango de fechas con filtros avanzados y capacidad de agrupar por proyecto, categoría, billetera o tipo. Útil para '¿Cuánto gasté en julio?' o 'Movimientos de agosto agrupados por proyecto'",
              parameters: {
                type: "object",
                properties: {
                  dateRange: {
                    type: "object",
                    properties: {
                      start: { type: "string", description: "Fecha inicio (YYYY-MM-DD)" },
                      end: { type: "string", description: "Fecha fin (YYYY-MM-DD)" }
                    },
                    required: ["start", "end"],
                    description: "Rango de fechas requerido"
                  },
                  filters: {
                    type: "object",
                    properties: {
                      projectNames: { type: "array", items: { type: "string" }, description: "Nombres de proyectos" },
                      categories: { type: "array", items: { type: "string" }, description: "Nombres de categorías" },
                      wallets: { type: "array", items: { type: "string" }, description: "Nombres de billeteras" },
                      types: { type: "array", items: { type: "string", enum: ["Ingreso", "Egreso"] }, description: "Tipos de movimiento" },
                      roles: { type: "array", items: { type: "string", enum: ["partner", "subcontractor", "personnel", "client"] }, description: "Roles" }
                    },
                    description: "Filtros opcionales"
                  },
                  groupBy: {
                    type: "string",
                    enum: ["project", "category", "wallet", "type"],
                    description: "Agrupar resultados por este campo. Opcional."
                  },
                  currency: {
                    type: "string",
                    description: "Código de moneda para filtrar. Opcional."
                  }
                },
                required: ["dateRange"]
              }
            }
          },
          
          // 7. getCashflowTrend (NUEVA)
          {
            type: "function" as const,
            function: {
              name: "getCashflowTrend",
              description: "Analiza tendencias de flujo de efectivo en el tiempo con intervalos diarios, semanales o mensuales. Muestra ingresos, egresos, flujo neto y balance acumulado por período. Identifica si la tendencia está mejorando o empeorando. Útil para 'Muéstrame el flujo de efectivo del último trimestre' o '¿Cómo ha sido mi flujo mensual?'",
              parameters: {
                type: "object",
                properties: {
                  scope: {
                    type: "string",
                    enum: ["organization", "project"],
                    description: "'organization' para toda la org, 'project' para un proyecto específico"
                  },
                  projectName: {
                    type: "string",
                    description: "Nombre del proyecto (requerido si scope='project'). Opcional si scope='organization'."
                  },
                  interval: {
                    type: "string",
                    enum: ["daily", "weekly", "monthly"],
                    description: "Intervalo de agrupación: 'daily', 'weekly', 'monthly'. Default: 'monthly'"
                  },
                  dateRange: {
                    type: "object",
                    properties: {
                      start: { type: "string", description: "Fecha inicio (YYYY-MM-DD)" },
                      end: { type: "string", description: "Fecha fin (YYYY-MM-DD)" }
                    },
                    description: "Rango de fechas. Si no se provee, usa últimos 3 meses."
                  },
                  currency: {
                    type: "string",
                    description: "Código de moneda para filtrar. Opcional."
                  }
                },
                required: ["scope"]
              }
            }
          }
        ]
      });

      const responseMessage = completion.choices[0]?.message;
      let responseContent = responseMessage?.content || "Lo siento, no pude generar una respuesta.";
      let usage = completion.usage;

      // Si la IA decidió usar una función
      if (responseMessage?.tool_calls && responseMessage.tool_calls.length > 0) {
        const toolCall = responseMessage.tool_calls[0];
        
        // Obtener organization_id
        const { data: userPrefs } = await authenticatedSupabase
          .from('user_preferences')
          .select('last_organization_id')
          .eq('user_id', userId)
          .maybeSingle();
        
        if (!userPrefs?.last_organization_id) {
          return res.status(400).json({ 
            error: "No tienes una organización seleccionada. Por favor selecciona una organización primero." 
          });
        }
        
        const organizationId = userPrefs.last_organization_id;
        
        try {
          // Parse arguments (con manejo de errores)
          let args: any;
          try {
            args = JSON.parse(toolCall.function.arguments);
          } catch (parseError) {
            console.error('Error parsing tool arguments:', parseError);
            return res.status(400).json({ 
              error: "Error al procesar los parámetros de la consulta." 
            });
          }
          
          let functionResult: string;
          
          // Ejecutar la función correspondiente
          switch (toolCall.function.name) {
            case 'getTotalPaymentsByContactAndProject': {
              const { getTotalPaymentsByContactAndProject } = await import('../../src/ai/tools/finances/getTotalPayments.js');
              functionResult = await getTotalPaymentsByContactAndProject(
                args.contactName,
                args.projectName,
                organizationId,
                authenticatedSupabase
              );
              break;
            }
            
            case 'getOrganizationBalance': {
              const { getOrganizationBalance } = await import('../../src/ai/tools/finances/getOrganizationBalance.js');
              functionResult = await getOrganizationBalance(
                organizationId,
                authenticatedSupabase,
                args.currency,
                args.convertTo
              );
              break;
            }
            
            case 'getProjectFinancialSummary': {
              const { getProjectFinancialSummary } = await import('../../src/ai/tools/finances/getProjectFinancialSummary.js');
              functionResult = await getProjectFinancialSummary(
                args.projectName,
                organizationId,
                args.includeBreakdown || false,
                authenticatedSupabase
              );
              break;
            }
            
            case 'getRoleSpending': {
              const { getRoleSpending } = await import('../../src/ai/tools/finances/getRoleSpending.js');
              functionResult = await getRoleSpending(
                args.role,
                organizationId,
                authenticatedSupabase,
                args.projectName,
                args.dateRange,
                args.currency
              );
              break;
            }
            
            case 'getContactMovements': {
              const { getContactMovements } = await import('../../src/ai/tools/finances/getContactMovements.js');
              functionResult = await getContactMovements(
                args.contactName,
                organizationId,
                authenticatedSupabase,
                args.projectName,
                args.dateRange,
                args.currency,
                args.convertTo
              );
              break;
            }
            
            case 'getDateRangeMovements': {
              const { getDateRangeMovements } = await import('../../src/ai/tools/finances/getDateRangeMovements.js');
              functionResult = await getDateRangeMovements(
                organizationId,
                args.dateRange,
                authenticatedSupabase,
                args.filters,
                args.groupBy,
                args.currency
              );
              break;
            }
            
            case 'getCashflowTrend': {
              const { getCashflowTrend } = await import('../../src/ai/tools/finances/getCashflowTrend.js');
              functionResult = await getCashflowTrend(
                organizationId,
                authenticatedSupabase,
                args.scope,
                args.projectName,
                args.interval || 'monthly',
                args.dateRange,
                args.currency
              );
              break;
            }
            
            default:
              functionResult = `Función ${toolCall.function.name} no implementada.`;
          }
          
          // Segunda llamada a OpenAI con el resultado de la función
          const secondCompletion = await openai.chat.completions.create({
            model: "gpt-4o",
            messages: [
              ...messages,
              responseMessage,
              {
                role: "tool" as const,
                content: functionResult,
                tool_call_id: toolCall.id
              }
            ],
            temperature: 0.7,
            max_tokens: 500
          });
          
          responseContent = secondCompletion.choices[0]?.message?.content || functionResult;
          usage = secondCompletion.usage || usage;
          
        } catch (toolError) {
          console.error('Error executing tool:', toolError);
          responseContent = "Lo siento, hubo un error al consultar los datos. Por favor intenta nuevamente.";
        }
      }

      // Guardar el mensaje del usuario (no bloqueante)
      authenticatedSupabase
        .from('ia_messages')
        .insert({
          user_id: userId,
          role: 'user',
          content: message,
          context_type: 'home_chat'
        })
        .then(({ error }) => {
          if (error) console.error('Error saving user message:', error);
        });

      // Guardar la respuesta de la IA (no bloqueante)
      authenticatedSupabase
        .from('ia_messages')
        .insert({
          user_id: userId,
          role: 'assistant',
          content: responseContent,
          context_type: 'home_chat'
        })
        .then(({ error }) => {
          if (error) console.error('Error saving assistant message:', error);
        });

      // Registrar el uso (no bloqueante)
      const promptTokens = usage?.prompt_tokens || 0;
      const completionTokens = usage?.completion_tokens || 0;
      const totalTokens = usage?.total_tokens || 0;
      const costUsd = ((promptTokens * 5) / 1000000) + ((completionTokens * 15) / 1000000);

      authenticatedSupabase
        .from('ia_usage_logs')
        .insert({
          user_id: userId,
          model: 'gpt-4o',
          provider: 'openai',
          prompt_tokens: promptTokens,
          completion_tokens: completionTokens,
          total_tokens: totalTokens,
          cost_usd: costUsd,
          context_type: 'home_chat'
        })
        .then(({ error }) => {
          if (error) console.error('Error logging usage:', error);
        });

      // Devolver la respuesta
      return res.status(200).json({
        response: responseContent
      });

    } catch (err: any) {
      console.error('Error in chat:', err);
      return res.status(500).json({
        error: "Error processing chat message"
      });
    }
  });

  // GET /api/ai/history - Get chat history for the user
  app.get("/api/ai/history", async (req, res) => {
    try {
      // Extraer token y autenticar
      const token = extractToken(req.headers.authorization);
      if (!token) {
        return res.status(401).json({ error: "No authorization token provided" });
      }

      const authenticatedSupabase = createAuthenticatedClient(token);

      // Obtener el usuario autenticado
      const { data: { user }, error: authError } = await authenticatedSupabase.auth.getUser();
      if (authError || !user) {
        return res.status(401).json({ error: "Unauthorized" });
      }

      // Obtener el usuario de la tabla users por auth_id
      const { data: dbUser } = await authenticatedSupabase
        .from('users')
        .select('id')
        .eq('auth_id', user.id)
        .single();

      if (!dbUser) {
        return res.status(404).json({ error: "User not found in database" });
      }

      const userId = dbUser.id;

      // Obtener los últimos 50 mensajes del chat del usuario
      // Ordenamos descendente para obtener los MÁS RECIENTES, luego invertimos para orden cronológico
      const { data: messages, error: messagesError } = await authenticatedSupabase
        .from('ia_messages')
        .select('role, content, created_at')
        .eq('user_id', userId)
        .eq('context_type', 'home_chat')
        .order('created_at', { ascending: false })
        .limit(50);

      if (messagesError) {
        console.error('Error fetching messages:', messagesError);
        return res.status(500).json({ error: "Error fetching chat history" });
      }

      // Invertir el orden para que aparezcan cronológicamente (más viejos primero)
      const orderedMessages = (messages || []).reverse();

      // Devolver los mensajes en orden cronológico
      return res.status(200).json({
        messages: orderedMessages
      });

    } catch (err: any) {
      console.error('Error in history:', err);
      return res.status(500).json({
        error: "Error fetching chat history"
      });
    }
  });

}
