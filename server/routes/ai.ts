import type { Express } from "express";
import type { RouteDeps } from "./_base";
import OpenAI from "openai";

interface Suggestion {
  label: string;
  action: string;
}

interface GreetingResponse {
  greeting: string;
  suggestions: Suggestion[];
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
}
