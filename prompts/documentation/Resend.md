Documentación Técnica: Sistema de Notificaciones por Email (Event-Driven)Proyecto: SeencelFecha de última actualización: 28 de Noviembre, 2025Estado: Funcional (Envíos al usuario final activos)1. Resumen EjecutivoEste documento detalla la arquitectura, configuración y flujo del sistema automatizado de notificaciones por correo electrónico.El objetivo del sistema es detectar eventos críticos de negocio en la base de datos (como el registro de un nuevo usuario o la inscripción a un curso) y enviar un correo electrónico transaccional correspondiente en tiempo real, sin depender de la acción del cliente en el frontend.2. Arquitectura del SistemaEl sistema utiliza una Arquitectura Basada en Eventos (Event-Driven Architecture). No hay un "cron job" revisando datos; la base de datos "avisa" cuando algo sucede.Diagrama de Flujo de DatosFragmento de códigograph TD
    A[Usuario/Frontend] -->|Acción (Registro/Compra)| B(Supabase DB);
    B -->|Detecta INSERT| C{Trigger SQL};
    C -->|Ejecuta| D[Función SQL Notificadora];
    D -->|POST Request (JSON)| E[Backend Express (Replit)];
    E -->|Llamada API con SDK| F[Resend API];
    F -->|Envía Email SMTP| G[Bandeja de Entrada del Usuario];
3. Componentes e InfraestructuraComponenteServicioRol en el sistemaBase de DatosSupabase (PostgreSQL)Fuente de la verdad. Detecta eventos (INSERT) e inicia el flujo.Webhook ClientSupabase (pg_net/http)Extensión de base de datos que permite realizar llamadas HTTP externas desde SQL.Backend APIReplit (Node.js/Express)Recibe el payload del webhook, procesa la lógica y se comunica con el proveedor de email.Proveedor de EmailResendServicio transaccional que se encarga de la entrega final del correo.4. Configuración Detallada Paso a Paso4.1. Proveedor de Email (Resend)Cuenta y Dominio: Se creó una cuenta en Resend y se verificó el dominio principal seencel.com mediante registros DNS (DKIM, SPF y MX).Estado: Verificado ✅.API Key: Se generó una llave de API con permisos completos de envío.Nota: La llave comienza con re_....4.2. Backend Express (Replit)El backend actúa como intermediario seguro para no exponer las credenciales de Resend.Dependencias: Se instaló la librería oficial:Bashnpm install resend
Variables de Entorno (Secrets):RESEND_API_KEY: Contiene la llave API generada en el paso 4.1.Endpoint del Webhook: Se creó una ruta POST /api/email/send encargada de recibir los datos de Supabase y despachar el correo.Código actual del Endpoint (en Express):JavaScriptimport { Resend } from 'resend';

// Inicialización del cliente
const resend = new Resend(process.env.RESEND_API_KEY);

// Ruta genérica para envío de correos desde webhooks
app.post('/api/email/send', async (req, res) => {
  // Extraemos los datos enviados por el webhook de Supabase
  const { to, subject, html, from } = req.body;

  // Validación básica
  if (!to || !subject || !html) {
    return res.status(400).json({ error: 'Faltan campos requeridos (to, subject, html)' });
  }

  try {
    const data = await resend.emails.send({
      // Usamos el dominio verificado. Si no se especifica 'from', usa el default.
      from: from || 'Notificaciones Seencel <sistema@seencel.com>',
      to: Array.isArray(to) ? to : [to], // Asegura que 'to' sea un array
      subject: subject,
      html: html,
    });

    console.log(`✅ Email enviado a ${to}:`, data.id);
    res.status(200).json({ message: "Email enviado correctamente", id: data.id });

  } catch (error) {
    console.error("❌ Error enviando email con Resend:", error);
    // Devolvemos 500 para que Supabase sepa que falló (y podría reintentar si se configura)
    res.status(500).json({ error: error.message });
  }
});
4.3. Base de Datos (Supabase)Esta es la configuración "reactiva" que inicia el proceso. Se realiza en el SQL Editor.1. Habilitar extensiones y permisos:SQL-- Permite a PostgreSQL hacer llamadas HTTP externas
create extension if not exists http with schema extensions;

-- Asegura que las tablas necesarias disparen triggers siempre
ALTER TABLE public.course_enrollments ENABLE TRIGGER ALL;
-- Nota: auth.users ya los tiene habilitados por defecto.
2. Función Notificadora SQL (El "Mensajero"):Esta función PL/pgSQL se ejecuta cuando ocurre un trigger. Decide qué email enviar y hace la llamada POST a Replit.⚠️ IMPORTANTE: La variable replit_url contiene la dirección hardcodeada de tu backend actual. Si cambias de URL, debes actualizar esta función.SQLcreate or replace function public.notify_replit_email()
returns trigger
language plpgsql
security definer -- Se ejecuta con permisos de superusuario para acceder a auth y http
as $$
declare
  -- URL del endpoint en el backend de Express
  replit_url text := 'https://seencel.matusukanec.repl.co/api/email/send';

  -- Variables para construir el payload
  email_subject text;
  email_html text;
  user_email text;
begin
  -- ==================================================
  -- LÓGICA 1: Nuevo Usuario Registrado (Tabla auth.users)
  -- ==================================================
  if TG_TABLE_NAME = 'users' and TG_TABLE_SCHEMA = 'auth' and TG_OP = 'INSERT' then
    user_email := NEW.email;
    email_subject := '¡Bienvenido a Seencel! 🏗️';
    -- Usamos datos del registro (metadata) para personalizar
    email_html := '<h1>Hola ' || coalesce(NEW.raw_user_meta_data->>'full_name', 'Arquitecto') || '!</h1><p>Gracias por unirte a la plataforma líder en gestión de proyectos de arquitectura.</p>';

  -- ==================================================
  -- LÓGICA 2: Nueva Inscripción (Tabla public.course_enrollments)
  -- ==================================================
  elsif TG_TABLE_NAME = 'course_enrollments' and TG_TABLE_SCHEMA = 'public' and TG_OP = 'INSERT' then
    -- Buscamos el email del usuario en la tabla auth.users usando su ID
    select email into user_email from auth.users where id = NEW.user_id;

    email_subject := 'Confirmación de Inscripción al Curso';
    email_html := '<h1>¡Felicitaciones!</h1><p>Ya estás inscrito correctamente en el curso.</p><p>ID de inscripción: ' || NEW.id || '</p>';

  else
    -- Si el evento no es ninguno de los anteriores, no hacemos nada.
    return NEW;
  end if;

  -- ==================================================
  -- EJECUCIÓN: Enviar el Webhook si tenemos datos
  -- ==================================================
  if user_email is not null and email_subject is not null then
    perform
      extensions.http((
        'POST',
        replit_url,
        ARRAY[extensions.http_header('Content-Type', 'application/json')],
        'application/json',
        jsonb_build_object(
          'to', user_email,
          'subject', email_subject,
          'html', email_html,
          'from', 'Seencel <hola@seencel.com>' -- Personalizamos el remitente para usuarios
        )::text
      )::extensions.http_request);
  end if;

  return NEW;
end;
$$;
3. Triggers (Los "Chivatos"):Conectan las tablas con la función anterior.SQL-- Trigger 1: Al registrarse un usuario
create trigger on_auth_user_created_send_email
after insert on auth.users
for each row execute function public.notify_replit_email();

-- Trigger 2: Al inscribirse en un curso
create trigger on_purchase_created_send_email
after insert on public.course_enrollments
for each row execute function public.notify_replit_email();
5. Estado Actual y Próximos PasosEstado Actual:El sistema está activo.Cuando un usuario se registra, recibe automáticamente el correo de bienvenida.El correo se envía al destinatario dinámico definido por el evento de la base de datos.Limitaciones Conocidas / Próximos Pasos:Notificación al Administrador: Actualmente, el sistema solo notifica al usuario final. El administrador no recibe copia. Se requiere modificar el endpoint de Express o la función SQL para duplicar el envío hacia una dirección de administrador fija.Manejo de Errores: Si el backend de Replit está caído, el trigger de base de datos fallará silenciosamente (o lanzará un error en los logs de Postgres), y el correo se perderá. No hay sistema de reintentos (retry queue) implementado.
