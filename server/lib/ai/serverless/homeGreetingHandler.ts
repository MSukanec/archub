import type { SupabaseClient } from "@supabase/supabase-js";
import OpenAI from "openai";
import { getGreetingSystemPrompt } from "../systemPrompt.js";

interface Suggestion {
  label: string;
  action: string;
}

interface GreetingResponse {
  greeting: string;
  suggestions: Suggestion[];
}

interface HomeGreetingHandlerParams {
  userId: string;
  supabase: SupabaseClient;
  openaiApiKey: string;
}

interface HomeGreetingHandlerResult {
  success: boolean;
  data?: GreetingResponse;
  error?: string;
  status: number;
}

// ========================================
// HELPERS: ZONA HORARIA ARGENTINA
// ========================================

/**
 * Obtener fecha/hora en zona horaria de Argentina (GMT-3)
 */
function getArgentinaDate(): Date {
  const now = new Date();
  const argentinaOffset = -3 * 60; // -3 horas en minutos
  const localOffset = now.getTimezoneOffset(); // offset del servidor en minutos
  const totalOffset = argentinaOffset - localOffset;
  return new Date(now.getTime() + totalOffset * 60 * 1000);
}

/**
 * Determinar período según hora actual en Argentina
 * - morning: 5:00 - 12:59
 * - afternoon: 13:00 - 18:59
 * - evening: 19:00 - 4:59
 */
function getCurrentPeriod(): 'morning' | 'afternoon' | 'evening' {
  const argentinaDate = getArgentinaDate();
  const hour = argentinaDate.getHours();
  if (hour >= 5 && hour < 13) return 'morning';
  if (hour >= 13 && hour < 19) return 'afternoon';
  return 'evening';
}

/**
 * Verificar si dos fechas son del mismo día en Argentina
 */
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

// ========================================
// HANDLER PRINCIPAL
// ========================================

/**
 * Handler compartido para el saludo de home
 * 
 * Este handler puede ser usado tanto por Express como por Vercel Functions.
 * 
 * IMPORTANTE:
 * - Los saludos NO consumen créditos del usuario
 * - Se cachean por período (morning/afternoon/evening) en zona horaria Argentina
 * - Máximo 3 saludos por día (uno por período)
 * - El registro en ia_messages y ia_usage_logs es no bloqueante
 */
export async function getHomeGreetingHandler(
  params: HomeGreetingHandlerParams
): Promise<HomeGreetingHandlerResult> {
  const { userId, supabase, openaiApiKey } = params;

  try {
    // ========================================
    // 0. VERIFICAR CACHÉ DE SALUDO POR PERIOD
    // ========================================
    // IMPORTANTE: Los saludos NO consumen créditos del usuario.
    // Se cachean por periodo (morning/afternoon/evening) para un máximo de 3 saludos/día.
    
    const currentPeriod = getCurrentPeriod();
    const nowArgentina = getArgentinaDate();
    
    const { data: cachedGreeting } = await supabase
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
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('full_name')
      .eq('id', userId)
      .single();

    if (userError || !userData) {
      return {
        success: false,
        error: "User not found",
        status: 404
      };
    }

    // Obtener preferencias de IA del usuario
    const { data: preferences } = await supabase
      .from('ia_user_preferences')
      .select('display_name, tone, language')
      .eq('user_id', userId)
      .single();

    // Obtener la organización actual del usuario
    const { data: userPrefs } = await supabase
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
    const { data: coursesInProgress } = await supabase
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
    const { data: recentProgress } = await supabase
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
    const { data: activeProjects } = organizationId ? await supabase
      .from('projects')
      .select('id, name, status')
      .eq('organization_id', organizationId)
      .eq('status', 'active')
      .order('created_at', { ascending: false })
      .limit(3) : { data: null };

    // 2.4 Últimos presupuestos
    const { data: recentBudgets } = organizationId ? await supabase
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
      supabase
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
      supabase
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
      supabase
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
    
    return {
      success: true,
      data: greetingResponse,
      status: 200
    };

  } catch (err: any) {
    console.error('Error in getHomeGreetingHandler:', err);
    
    // Fallback en caso de error - retornar respuesta básica pero válida
    return {
      success: true,
      data: {
        greeting: "¡Hola! ¿Cómo estás hoy?",
        suggestions: [
          { label: "Explorar cursos", action: "/learning/courses" },
          { label: "Ver proyectos", action: "/organization/projects" }
        ]
      },
      status: 200
    };
  }
}
