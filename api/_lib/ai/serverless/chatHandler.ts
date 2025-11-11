/**
 * 🤖 ARCHUB CORE AI - Chat Handler Compartido
 * 
 * Handler compartido para el chat con IA que puede ser usado tanto por:
 * - Express (server/routes/ai.ts)
 * - Vercel Functions (api/ai/chat.ts)
 * 
 * Extrae toda la lógica del endpoint POST /api/ai/chat en una función pura
 * sin dependencias de Express.
 */

import type { SupabaseClient } from "@supabase/supabase-js";
import OpenAI from "openai";
import { getChatSystemPrompt } from "../systemPrompt.js";
import { runAIPipeline, enrichSystemPrompt, cacheAIResult, getPipelineMetrics } from "../orchestrator/pipeline.js";
import type { AIContext } from "../orchestrator/types.js";

/**
 * Parámetros para la función getChatHandler
 */
export interface ChatHandlerParams {
  userId: string;
  message: string;
  history: Array<{ role: string; content: string }>;
  supabase: SupabaseClient;
  openaiApiKey: string;
  organizationId: string | null;
}

/**
 * Respuesta de la función getChatHandler
 */
export interface ChatHandlerResponse {
  success: boolean;
  data?: {
    response: string;
    cached?: boolean;
    metrics?: any;
    limitReached?: boolean;
    remainingPrompts?: number;
  };
  error?: string;
  status: number;
}

/**
 * Resultado de verificación de límites de uso
 */
export interface UsageLimitCheck {
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
export async function checkAndIncrementUsageLimit(
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

/**
 * Handler principal del chat con IA
 * 
 * Ejecuta todo el flujo de procesamiento:
 * 1. Verifica límites de uso
 * 2. Obtiene preferencias del usuario
 * 3. Ejecuta pipeline de AI
 * 4. Llama a GPT-4o con function calling
 * 5. Ejecuta herramientas si es necesario
 * 6. Guarda mensajes y métricas
 * 7. Cachea resultados
 */
export async function getChatHandler(params: ChatHandlerParams): Promise<ChatHandlerResponse> {
  const { userId, message, history, supabase, openaiApiKey, organizationId } = params;

  try {
    // ========================================
    // 0. VERIFICAR LÍMITES DE USO (después de validar request)
    // ========================================
    const limitCheck = await checkAndIncrementUsageLimit(userId, supabase);
    
    if (!limitCheck.allowed) {
      return {
        success: false,
        error: limitCheck.message,
        status: 429,
        data: {
          response: '',
          limitReached: true,
          remainingPrompts: 0
        }
      };
    }

    // Obtener datos del usuario para contexto
    const { data: userData } = await supabase
      .from('users')
      .select('full_name')
      .eq('id', userId)
      .single();

    const { data: preferences } = await supabase
      .from('ia_user_preferences')
      .select('display_name, tone, language')
      .eq('user_id', userId)
      .single();

    const displayName = preferences?.display_name || userData?.full_name || "Usuario";
    const tone = preferences?.tone || "amistoso";
    const language = preferences?.language || "es";

    // ========================================
    // ORCHESTRATOR: Ejecutar pipeline de razonamiento inteligente
    // ========================================
    const aiContext: AIContext = {
      userId,
      organizationId: organizationId || '',
      language,
      timezone: 'America/Argentina/Buenos_Aires'
    };

    const pipelineContext = await runAIPipeline(message, aiContext, supabase);

    // Si el pipeline devolvió un resultado cacheado, devolverlo directamente
    if (pipelineContext.metadata.cacheHit && pipelineContext.result) {
      console.log('[AI Pipeline] Cache hit - returning cached response');
      return {
        success: true,
        status: 200,
        data: {
          response: pipelineContext.result,
          cached: true,
          metrics: getPipelineMetrics(pipelineContext)
        }
      };
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
        },
        
        // 11. getOrganizationInfo (NUEVA)
        {
          type: "function" as const,
          function: {
            name: "getOrganizationInfo",
            description: "Obtiene información básica de la organización actual: nombre, plan (free/pro/teams), descripción, datos de contacto, ubicación, estadísticas (total de miembros y proyectos), fecha de creación. Útil para '¿En qué empresa estamos?', 'Dame información de mi organización', '¿Qué plan tenemos?', 'Datos de la empresa'",
            parameters: {
              type: "object",
              properties: {},
              required: []
            }
          }
        },
        
        // 12. getOrganizationMembers (NUEVA)
        {
          type: "function" as const,
          function: {
            name: "getOrganizationMembers",
            description: "Obtiene la lista completa de miembros de la organización con sus roles (Admin, Member, Guest), fecha de incorporación y última actividad. Puede filtrar por rol específico. Útil para '¿Cuántos miembros tenemos?', 'Lista de miembros', 'Quiénes son los admins', 'Muéstrame los miembros de la empresa'",
            parameters: {
              type: "object",
              properties: {
                role: {
                  type: "string",
                  description: "Filtrar por rol específico (ej: 'Admin', 'Member', 'Guest'). Opcional."
                },
                includeInactive: {
                  type: "boolean",
                  description: "Incluir miembros inactivos. Default: false"
                }
              },
              required: []
            }
          }
        },
        
        // 13. getOrganizationActivity (NUEVA)
        {
          type: "function" as const,
          function: {
            name: "getOrganizationActivity",
            description: "Obtiene actividad en TIEMPO REAL de la organización: cuántos miembros están online AHORA MISMO, qué están viendo, miembros activos en la última hora, porcentaje de actividad. Útil para '¿Cuántos miembros online hay?', '¿Quién está conectado?', 'Actividad de la organización', '¿Quién está trabajando ahora?'",
            parameters: {
              type: "object",
              properties: {},
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
      
      // Validar que sea un function tool call (ANTES de acceder a .function)
      if (toolCall.type !== 'function') {
        console.error('Unsupported tool call type:', toolCall.type);
        return {
          success: false,
          error: "Tipo de herramienta no soportado.",
          status: 400
        };
      }
      
      console.log('Function name:', toolCall.function.name);
      console.log('Function arguments:', toolCall.function.arguments);
      
      // Verificar que haya organizationId
      if (!organizationId) {
        return {
          success: false,
          error: "No tienes una organización seleccionada. Por favor selecciona una organización primero.",
          status: 400
        };
      }
      
      try {
        // Parse arguments (con manejo de errores)
        let args: any;
        try {
          args = JSON.parse(toolCall.function.arguments);
        } catch (parseError) {
          console.error('Error parsing tool arguments:', parseError);
          return {
            success: false,
            error: "Error al procesar los parámetros de la consulta.",
            status: 400
          };
        }
        
        let functionResult: string;
        
        // Ejecutar la función correspondiente
        switch (toolCall.function.name) {
          case 'getTotalPaymentsByContactAndProject': {
            const { getTotalPaymentsByContactAndProject } = await import('../tools/finances/getTotalPayments');
            functionResult = await getTotalPaymentsByContactAndProject(
              args.contactName,
              args.projectName,
              organizationId,
              supabase
            );
            break;
          }
          
          case 'getOrganizationBalance': {
            const { getOrganizationBalance } = await import('../tools/finances/getOrganizationBalance');
            functionResult = await getOrganizationBalance(
              organizationId,
              supabase,
              args.currency,
              args.convertTo
            );
            break;
          }
          
          case 'getProjectFinancialSummary': {
            const { getProjectFinancialSummary } = await import('../tools/finances/getProjectFinancialSummary');
            functionResult = await getProjectFinancialSummary(
              args.projectName,
              organizationId,
              args.includeBreakdown || false,
              supabase
            );
            break;
          }
          
          case 'getRoleSpending': {
            const { getRoleSpending } = await import('../tools/finances/getRoleSpending');
            functionResult = await getRoleSpending(
              args.role,
              organizationId,
              supabase,
              args.projectName,
              args.dateRange,
              args.currency
            );
            break;
          }
          
          case 'getContactMovements': {
            const { getContactMovements } = await import('../tools/finances/getContactMovements');
            functionResult = await getContactMovements(
              args.contactName,
              organizationId,
              supabase,
              args.projectName,
              args.dateRange,
              args.currency,
              args.convertTo
            );
            break;
          }
          
          case 'getDateRangeMovements': {
            const { getDateRangeMovements } = await import('../tools/finances/getDateRangeMovements');
            functionResult = await getDateRangeMovements(
              organizationId,
              args.dateRange,
              supabase,
              args.filters,
              args.groupBy,
              args.currency
            );
            break;
          }
          
          case 'getCashflowTrend': {
            const { getCashflowTrend } = await import('../tools/finances/getCashflowTrend');
            functionResult = await getCashflowTrend(
              organizationId,
              supabase,
              args.scope,
              args.projectName,
              args.interval || 'monthly',
              args.dateRange,
              args.currency
            );
            break;
          }
          
          case 'getProjectsList': {
            const { getProjectsList } = await import('../tools/projects/getProjectsList');
            functionResult = await getProjectsList(
              organizationId,
              supabase,
              args.status ? { status: args.status } : undefined
            );
            break;
          }
          
          case 'getProjectDetails': {
            const { getProjectDetails } = await import('../tools/projects/getProjectDetails');
            functionResult = await getProjectDetails(
              args.projectName,
              organizationId,
              supabase
            );
            break;
          }
          
          case 'getClientCommitments': {
            const { getClientCommitments } = await import('../tools/finances/getClientCommitments');
            functionResult = await getClientCommitments(
              organizationId,
              supabase,
              args.clientName,
              args.projectName,
              args.currency,
              args.convertTo
            );
            break;
          }
          
          case 'getOrganizationInfo': {
            const { getOrganizationInfo } = await import('../tools/organization/getOrganizationInfo');
            functionResult = await getOrganizationInfo(
              organizationId,
              supabase
            );
            break;
          }
          
          case 'getOrganizationMembers': {
            const { getOrganizationMembers } = await import('../tools/organization/getOrganizationMembers');
            functionResult = await getOrganizationMembers(
              organizationId,
              supabase,
              {
                role: args.role,
                includeInactive: args.includeInactive
              }
            );
            break;
          }
          
          case 'getOrganizationActivity': {
            const { getOrganizationActivity } = await import('../tools/organization/getOrganizationActivity');
            functionResult = await getOrganizationActivity(
              organizationId,
              supabase
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
    supabase
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
    supabase
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
    return {
      success: true,
      status: 200,
      data: {
        response: responseContent,
        metrics: getPipelineMetrics(pipelineContext),
        remainingPrompts: limitCheck.remainingPrompts
      }
    };

  } catch (err: any) {
    console.error('Error in chat handler:', err);
    return {
      success: false,
      error: "Error processing chat message",
      status: 500
    };
  }
}
