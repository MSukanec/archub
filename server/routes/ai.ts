import type { Express } from "express";
import type { RouteDeps } from "./_base";
import type { SupabaseClient } from "@supabase/supabase-js";
import OpenAI from "openai";
import { getGreetingSystemPrompt, getChatSystemPrompt } from "../../src/ai/systemPrompt";
import { runAIPipeline, enrichSystemPrompt, cacheAIResult, getPipelineMetrics } from "../../src/ai/orchestrator/pipeline";
import type { AIContext } from "../../src/ai/orchestrator/types";

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

  // Helper: Obtener fecha/hora en zona horaria de Argentina (GMT-3)
  function getArgentinaDate(): Date {
    // Crear fecha en UTC y ajustar a Argentina (GMT-3)
    const now = new Date();
    const argentinaOffset = -3 * 60; // -3 horas en minutos
    const localOffset = now.getTimezoneOffset(); // offset del servidor en minutos
    const totalOffset = argentinaOffset - localOffset;
    return new Date(now.getTime() + totalOffset * 60 * 1000);
  }

  // Helper: Determinar period según hora actual en Argentina (5-13: morning, 13-19: afternoon, 19-5: evening)
  function getCurrentPeriod(): 'morning' | 'afternoon' | 'evening' {
    const argentinaDate = getArgentinaDate();
    const hour = argentinaDate.getHours();
    if (hour >= 5 && hour < 13) return 'morning';
    if (hour >= 13 && hour < 19) return 'afternoon';
    return 'evening';
  }

  // Helper: Verificar si dos fechas son del mismo día en Argentina
  function isSameDayInArgentina(date1: Date, date2: Date): boolean {
    const d1 = new Date(date1.getTime());
    const d2 = new Date(date2.getTime());
    
    // Convertir ambas a Argentina y comparar solo la fecha
    const arg1 = getArgentinaDate();
    arg1.setTime(d1.getTime());
    const arg2 = getArgentinaDate();
    arg2.setTime(d2.getTime());
    
    return (
      arg1.getFullYear() === arg2.getFullYear() &&
      arg1.getMonth() === arg2.getMonth() &&
      arg1.getDate() === arg2.getDate()
    );
  }

  // GET /api/ai/home_greeting - AI-powered home greeting with suggestions (cached by period)
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
      // 0. VERIFICAR CACHÉ DE SALUDO POR PERIOD
      // ========================================
      // IMPORTANTE: Los saludos NO consumen créditos del usuario.
      // Se cachean por periodo (morning/afternoon/evening) para un máximo de 3 saludos/día.
      
      const currentPeriod = getCurrentPeriod();
      const nowArgentina = getArgentinaDate();
      
      const { data: cachedGreeting } = await authenticatedSupabase
        .from('ia_user_greetings')
        .select('greeting, created_at')
        .eq('user_id', userId)
        .eq('period', currentPeriod)
        .maybeSingle();
      
      // Verificar que el caché sea de hoy en Argentina (comparar solo fecha, no hora)
      const isCacheValid = cachedGreeting && 
        isSameDayInArgentina(new Date(cachedGreeting.created_at), nowArgentina);
      
      let greetingText: string | null = isCacheValid ? cachedGreeting.greeting : null;
      let shouldGenerateWithGPT = !greetingText;

      // NOTA: Los saludos NO verifican límites de uso - tienen su propio sistema de caché
      // Los límites solo aplican a los mensajes de chat del usuario

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
      
      // Usar fecha en zona horaria de Argentina para el contexto
      const argentinaDate = getArgentinaDate();
      const today = argentinaDate.toLocaleDateString(language === 'es' ? 'es-AR' : 'en-US', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        timeZone: 'America/Argentina/Buenos_Aires'
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
      // 4. GENERAR O USAR SALUDO CACHEADO
      // ========================================
      
      let greetingResponse: GreetingResponse;

      // Detectar si el usuario es nuevo (sin datos reales)
      const isNewUser = (
        (!coursesInProgress || coursesInProgress.length === 0) &&
        (!activeProjects || activeProjects.length === 0) &&
        (!recentBudgets || recentBudgets.length === 0)
      );

      if (shouldGenerateWithGPT) {
        // GENERAR NUEVO SALUDO CON GPT
        const openai = new OpenAI({
          apiKey: openaiApiKey,
        });

        // Usar prompt centralizado de systemPrompt.ts
        const systemPrompt = getGreetingSystemPrompt({ language, tone, displayName });

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
        
        try {
          greetingResponse = JSON.parse(responseContent);
          
          // Validar que tenga la estructura esperada
          if (!greetingResponse.greeting || !Array.isArray(greetingResponse.suggestions)) {
            throw new Error("Invalid response structure");
          }

          // Si el usuario es nuevo, NO mostrar sugerencias inventadas
          // (esperamos a implementar el tutorial)
          if (isNewUser) {
            greetingResponse.suggestions = [];
          }
        } catch (parseError) {
          console.error('Error parsing GPT response:', parseError);
          // Fallback si la respuesta no es JSON válido
          greetingResponse = {
            greeting: `¡Hola, ${displayName}! ¿Cómo estás hoy?`,
            suggestions: [] // No sugerencias para usuarios nuevos
          };
        }

        // Guardar el greeting en caché (tabla ia_user_greetings)
        authenticatedSupabase
          .from('ia_user_greetings')
          .upsert({
            user_id: userId,
            period: currentPeriod,
            greeting: greetingResponse.greeting
          }, {
            onConflict: 'user_id,period'
          })
          .then(({ error }) => {
            if (error) console.error('Error saving greeting cache:', error);
          });

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
      
      } else {
        // USAR SALUDO CACHEADO + GENERAR SUGGESTIONS DINÁMICAS
        // Las suggestions se generan en tiempo real basadas en el contexto actual del usuario
        greetingResponse = {
          greeting: greetingText!,
          suggestions: []
        };

        // Generar suggestions basadas en contexto actual
        if (coursesInProgress && coursesInProgress.length > 0) {
          const course = coursesInProgress[0] as any;
          if (course?.courses?.slug && course?.courses?.title) {
            greetingResponse.suggestions.push({
              label: `Continuar curso '${course.courses.title}'`,
              action: `/learning/courses/${course.courses.slug}`
            });
          }
        }

        if (activeProjects && activeProjects.length > 0) {
          greetingResponse.suggestions.push({
            label: "Revisar proyectos activos",
            action: "/organization/projects"
          });
        }

        if (recentBudgets && recentBudgets.length > 0) {
          const budget = recentBudgets[0] as any;
          const project = Array.isArray(budget?.projects) ? budget.projects[0] : budget?.projects;
          if (project?.name && budget?.name) {
            greetingResponse.suggestions.push({
              label: `Revisar presupuesto '${budget.name}' de ${project.name}`,
              action: "/organization/budgets"
            });
          }
        }

        // NO agregar sugerencias genéricas si el usuario es nuevo
        // (cuando llegue el tutorial, se agregará una sugerencia específica para eso)
      }

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

      // Obtener organization_id para function calling
      const { data: userPrefs } = await authenticatedSupabase
        .from('user_preferences')
        .select('last_organization_id')
        .eq('user_id', userId)
        .single();

      const organizationId = userPrefs?.last_organization_id;

      // ========================================
      // ORCHESTRATOR: Ejecutar pipeline de razonamiento inteligente
      // ========================================
      const aiContext: AIContext = {
        userId,
        organizationId: organizationId || '',
        language,
        timezone: 'America/Argentina/Buenos_Aires'
      };

      const pipelineContext = await runAIPipeline(message, aiContext, authenticatedSupabase);

      // Si el pipeline devolvió un resultado cacheado, devolverlo directamente
      if (pipelineContext.metadata.cacheHit && pipelineContext.result) {
        console.log('[AI Pipeline] Cache hit - returning cached response');
        return res.status(200).json({
          response: pipelineContext.result,
          cached: true,
          metrics: getPipelineMetrics(pipelineContext)
        });
      }

      // Si hubo error en el pipeline, continuar con GPT pero sin enriquecer
      if (pipelineContext.error) {
        console.warn('[AI Pipeline] Error:', pipelineContext.error);
      }

      // Obtener base system prompt
      const baseSystemPrompt = getChatSystemPrompt({ language, tone, displayName });

      // Enriquecer con contexto del pipeline (si no hubo error)
      const enrichedSystemPrompt = pipelineContext.error
        ? baseSystemPrompt
        : enrichSystemPrompt(baseSystemPrompt, pipelineContext);

      // Log del pipeline para debugging
      if (pipelineContext.intent) {
        console.log('[AI Pipeline] Intent:', pipelineContext.intent.type, pipelineContext.intent.subtype);
        console.log('[AI Pipeline] Entities:', pipelineContext.intent.entities.map(e => `${e.type}:${e.name}`));
      }
      if (pipelineContext.queryPlan) {
        console.log('[AI Pipeline] Suggested tool:', pipelineContext.queryPlan.toolName);
      }

      // Construir el historial de mensajes para GPT
      const messages = [
        {
          role: "system" as const,
          content: enrichedSystemPrompt
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
              description: "Resumen financiero COMPLETO de un PROYECTO: balance total, ingresos totales, egresos totales de TODO EL TIEMPO. NO filtra por fechas. Usar para: 'Balance del proyecto X', 'Resumen financiero de Y', 'Cuánto llevo gastado en proyecto Z'",
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
              description: "Obtiene movimientos de una PERSONA o EMPRESA específica (contacto/proveedor/cliente, NO proyectos). Con detalle individual (fecha, monto, descripción). SOLO usar cuando se menciona el NOMBRE DE UNA PERSONA/EMPRESA. Ejemplos: '¿Qué le pagué a Juan?', 'Movimientos de empresa ABC', 'Balance de proveedor XYZ'. NO usar para consultas sobre proyectos.",
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
              description: "Movimientos con FILTROS AVANZADOS: por fechas, proyecto, tipo (Ingreso/Egreso), categoría, billetera. USAR para consultas como: 'Egresos del proyecto X este año', 'Gastos en julio', 'Ingresos de proyecto Y en 2025', 'Cuánto gasté en obra Z este mes en ARS'. Permite filtrar por TIPO (Ingreso/Egreso) y PROYECTO simultáneamente.",
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
          
          // 7. getCashflowTrend
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
          },
          
          // 8. getProjectsList
          {
            type: "function" as const,
            function: {
              name: "getProjectsList",
              description: "Obtiene la lista de proyectos de la organización con información básica (nombre, estado, fechas, prioridad). Útil para responder '¿Cuántos proyectos tengo?', '¿En qué proyectos vengo trabajando?', 'Muéstrame mis proyectos activos'",
              parameters: {
                type: "object",
                properties: {
                  status: {
                    type: "string",
                    description: "Filtrar por estado del proyecto (ej: 'draft', 'active', 'completed'). Opcional."
                  }
                },
                required: []
              }
            }
          },
          
          // 9. getProjectDetails
          {
            type: "function" as const,
            function: {
              name: "getProjectDetails",
              description: "Obtiene información detallada de un proyecto específico incluyendo descripción, estado, fechas, prioridad, moneda, impuestos, creador, etc. Útil para 'Dame información del proyecto X', 'Detalles del proyecto Casa Blanca', '¿Cuál es la dirección del proyecto Y?'",
              parameters: {
                type: "object",
                properties: {
                  projectName: {
                    type: "string",
                    description: "Nombre del proyecto a buscar (puede ser parcial, búsqueda fuzzy)"
                  }
                },
                required: ["projectName"]
              }
            }
          },
          
          // 10. getClientCommitments (CRÍTICA - evita alucinación)
          {
            type: "function" as const,
            function: {
              name: "getClientCommitments",
              description: "CRÍTICA para consultar APORTES y COMPROMISOS DE CLIENTES. Obtiene el monto comprometido total por cada cliente, cuánto ha pagado realmente, cuánto falta pagar, y el % de avance del pago. EVITA que la IA invente datos financieros. Utilizar SIEMPRE para preguntas sobre 'cuánto aportó', 'cuánto pagó', 'cuánto falta' de clientes. Puede filtrar por cliente específico, proyecto, moneda, y convertir entre monedas.",
              parameters: {
                type: "object",
                properties: {
                  clientName: {
                    type: "string",
                    description: "Nombre del cliente (opcional, si se omite muestra todos los clientes)"
                  },
                  projectName: {
                    type: "string",
                    description: "Nombre del proyecto (opcional)"
                  },
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
          }
        ]
      });

      const responseMessage = completion.choices[0]?.message;
      let responseContent = responseMessage?.content || "Lo siento, no pude generar una respuesta.";
      let usage = completion.usage;

      console.log('===== AI CHAT DEBUG =====');
      console.log('Response message tool_calls:', responseMessage?.tool_calls);
      console.log('Response message content:', responseMessage?.content);

      // Si la IA decidió usar una función
      if (responseMessage?.tool_calls && responseMessage.tool_calls.length > 0) {
        const toolCall = responseMessage.tool_calls[0];
        
        console.log('Function name:', toolCall.function.name);
        console.log('Function arguments:', toolCall.function.arguments);
        
        // Validar que sea un function tool call
        if (toolCall.type !== 'function') {
          console.error('Unsupported tool call type:', toolCall.type);
          return res.status(400).json({ 
            error: "Tipo de herramienta no soportado." 
          });
        }
        
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
            
            case 'getProjectsList': {
              const { getProjectsList } = await import('../../src/ai/tools/projects/getProjectsList.js');
              functionResult = await getProjectsList(
                organizationId,
                authenticatedSupabase,
                args.status ? { status: args.status } : undefined
              );
              break;
            }
            
            case 'getProjectDetails': {
              const { getProjectDetails } = await import('../../src/ai/tools/projects/getProjectDetails.js');
              functionResult = await getProjectDetails(
                args.projectName,
                organizationId,
                authenticatedSupabase
              );
              break;
            }
            
            case 'getClientCommitments': {
              const { getClientCommitments } = await import('../../src/ai/tools/finances/getClientCommitments.js');
              functionResult = await getClientCommitments(
                organizationId,
                authenticatedSupabase,
                args.clientName,
                args.projectName,
                args.currency,
                args.convertTo
              );
              break;
            }
            
            default:
              functionResult = `Función ${toolCall.function.name} no implementada.`;
          }
          
          console.log('Function result:', functionResult);
          
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

      // Cachear el resultado para futuras consultas idénticas
      if (organizationId) {
        cacheAIResult(message, organizationId, responseContent);
      }

      // Devolver la respuesta
      return res.status(200).json({
        response: responseContent,
        metrics: getPipelineMetrics(pipelineContext)
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
