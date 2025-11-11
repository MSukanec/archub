import { useEffect, useState } from "react";
import { ArrowUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { PublicLayout } from "@/components/layout/public/PublicLayout";

export default function Privacy() {
  const [activeSection, setActiveSection] = useState("about");
  const [showScrollTop, setShowScrollTop] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setShowScrollTop(window.scrollY > 400);

      const sections = document.querySelectorAll("[data-section]");
      let currentSection = "about";

      sections.forEach((section) => {
        const rect = section.getBoundingClientRect();
        if (rect.top <= 150 && rect.bottom >= 150) {
          currentSection = section.getAttribute("data-section") || "about";
        }
      });

      setActiveSection(currentSection);
    };

    window.addEventListener("scroll", handleScroll);
    
    return () => {
      window.removeEventListener("scroll", handleScroll);
    };
  }, []);

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const scrollToSection = (sectionId: string) => {
    const element = document.querySelector(`[data-section="${sectionId}"]`);
    if (element) {
      const top = element.getBoundingClientRect().top + window.scrollY - 100;
      window.scrollTo({ top, behavior: "smooth" });
    }
  };

  const sections = [
    { id: "about", label: "Acerca de Seencel" },
    { id: "applicability", label: "Aplicabilidad" },
    { id: "data-accessed", label: "Datos que Recopilamos" },
    { id: "google-data", label: "Datos de Google" },
    { id: "data-usage", label: "Cómo Usamos los Datos" },
    { id: "data-sharing", label: "Compartir Datos" },
    { id: "data-storage", label: "Almacenamiento y Protección" },
    { id: "data-retention", label: "Retención y Eliminación" },
    { id: "your-rights", label: "Tus Derechos" },
    { id: "security", label: "Medidas de Seguridad" },
    { id: "third-party", label: "Servicios de Terceros" },
    { id: "children", label: "Privacidad de Menores" },
    { id: "changes", label: "Cambios a esta Política" },
    { id: "contact", label: "Contacto" },
  ];

  return (
    <PublicLayout 
      headerRightContent="Última actualización: Noviembre 2025"
      seo={{
        title: "Política de Privacidad - Seencel",
        description: "Política de privacidad de Seencel. Información sobre cómo recopilamos, usamos, compartimos y protegemos tus datos personales. Cumplimiento con Google OAuth y normativas de privacidad.",
        ogTitle: "Política de Privacidad - Seencel",
        ogDescription: "Información sobre cómo Seencel protege tus datos personales y cumple con normativas de privacidad."
      }}
    >
      <div className="flex gap-12 relative">
          {/* Main Content */}
          <main className="flex-1 max-w-3xl">
            <div className="space-y-12">
              {/* Hero */}
              <div className="space-y-4">
                <h1 className="text-4xl font-bold tracking-tight">
                  Política de Privacidad
                </h1>
                <p className="text-lg text-muted-foreground">
                  En Seencel, respetamos tu privacidad y nos comprometemos a proteger 
                  tus datos personales. Esta política explica cómo recopilamos, usamos, 
                  compartimos y protegemos tu información.
                </p>
              </div>

              {/* About Seencel */}
              <section data-section="about" className="space-y-4">
                <h2 className="text-2xl font-semibold tracking-tight">
                  Acerca de Seencel
                </h2>
                <p className="text-muted-foreground leading-relaxed">
                  Seencel es una plataforma integral de gestión para la construcción y 
                  arquitectura. Ofrecemos herramientas para la gestión de proyectos, 
                  seguimiento presupuestario, gestión de equipos, documentación, análisis 
                  financiero, y capacitación profesional.
                </p>
                <p className="text-muted-foreground leading-relaxed">
                  Nuestros servicios incluyen:
                </p>
                <ul className="list-disc list-inside space-y-2 text-muted-foreground ml-4">
                  <li>Gestión de proyectos de construcción</li>
                  <li>Seguimiento financiero y presupuestario con soporte multi-moneda</li>
                  <li>Gestión de personal y asignaciones</li>
                  <li>Sistema de documentación y archivos</li>
                  <li>Módulo de capacitación profesional</li>
                  <li>Análisis y reportes inteligentes con IA</li>
                  <li>Integración con Google Maps para geolocalización</li>
                  <li>Sistema de pagos para cursos y suscripciones</li>
                </ul>
              </section>

              {/* Applicability */}
              <section data-section="applicability" className="space-y-4">
                <h2 className="text-2xl font-semibold tracking-tight">
                  Aplicabilidad
                </h2>
                <p className="text-muted-foreground leading-relaxed">
                  Esta Política de Privacidad se aplica cuando:
                </p>
                <ul className="list-disc list-inside space-y-2 text-muted-foreground ml-4">
                  <li>Visitas nuestro sitio web (seencel.com y dominios relacionados)</li>
                  <li>Te registras o inicias sesión en nuestra plataforma</li>
                  <li>Utilizas nuestros servicios como usuario autorizado</li>
                  <li>Participas en nuestros programas de capacitación</li>
                  <li>Realizas pagos o transacciones en nuestra plataforma</li>
                  <li>Interactúas con nuestras funciones de IA y asistencia</li>
                  <li>Te comunicas con nosotros para soporte o consultas</li>
                </ul>
              </section>

              {/* Data Accessed */}
              <section data-section="data-accessed" className="space-y-4">
                <h2 className="text-2xl font-semibold tracking-tight">
                  Datos que Recopilamos
                </h2>
                
                <h3 className="text-xl font-medium mt-6">Información que Proporcionas Directamente</h3>
                <p className="text-muted-foreground leading-relaxed">
                  Recopilamos la siguiente información cuando te registras o utilizas nuestros servicios:
                </p>
                <ul className="list-disc list-inside space-y-2 text-muted-foreground ml-4">
                  <li><strong>Información de Contacto:</strong> Nombre, apellido, dirección de correo electrónico, número de teléfono, país, fecha de nacimiento</li>
                  <li><strong>Información Profesional:</strong> Nombre de la organización, cargo, área de especialización</li>
                  <li><strong>Información de Cuenta:</strong> Nombre de usuario, contraseña (encriptada), foto de perfil, preferencias de usuario</li>
                  <li><strong>Información Transaccional:</strong> Datos de facturación, dirección, información de pago (procesada por terceros), historial de compras</li>
                  <li><strong>Contenido del Usuario:</strong> Documentos, archivos, imágenes, videos, notas, comentarios, y cualquier contenido que subas a la plataforma</li>
                  <li><strong>Información de Proyectos:</strong> Datos de proyectos, presupuestos, tareas, personal, cronogramas, ubicaciones</li>
                  <li><strong>Interacciones con IA:</strong> Consultas al asistente de IA, prompts, conversaciones</li>
                </ul>

                <h3 className="text-xl font-medium mt-6">Información que Recopilamos Automáticamente</h3>
                <ul className="list-disc list-inside space-y-2 text-muted-foreground ml-4">
                  <li><strong>Información de Uso:</strong> Páginas visitadas, funciones utilizadas, tiempo de uso, patrones de navegación</li>
                  <li><strong>Información del Dispositivo:</strong> Tipo de dispositivo, sistema operativo, navegador, dirección IP, identificadores únicos</li>
                  <li><strong>Información de Ubicación:</strong> Ubicación aproximada basada en dirección IP, ubicación precisa si autorizas GPS</li>
                  <li><strong>Cookies y Tecnologías Similares:</strong> Utilizamos cookies para mejorar tu experiencia (ver nuestra Política de Cookies)</li>
                  <li><strong>Datos de Rendimiento:</strong> Logs de servidor, tiempos de respuesta, errores, métricas de rendimiento</li>
                </ul>
              </section>

              {/* Google Data */}
              <section data-section="google-data" className="space-y-4">
                <h2 className="text-2xl font-semibold tracking-tight">
                  Datos de Google que Accedemos
                </h2>
                <p className="text-muted-foreground leading-relaxed">
                  Cuando eliges iniciar sesión con tu cuenta de Google, accedemos a los 
                  siguientes datos de tu perfil de Google:
                </p>
                <ul className="list-disc list-inside space-y-2 text-muted-foreground ml-4">
                  <li><strong>Información Básica de Perfil:</strong> Nombre, apellido, dirección de correo electrónico de Google</li>
                  <li><strong>Foto de Perfil:</strong> Tu foto de perfil de Google (si está disponible públicamente)</li>
                  <li><strong>ID de Usuario de Google:</strong> Identificador único de tu cuenta de Google para autenticación</li>
                </ul>
                <p className="text-muted-foreground leading-relaxed mt-4">
                  <strong>Importante:</strong> Solo accedemos a la información mínima necesaria 
                  para crear y gestionar tu cuenta. No accedemos a tus correos electrónicos de Gmail, 
                  Google Drive, calendario u otros servicios de Google. No almacenamos tu contraseña 
                  de Google.
                </p>
                <p className="text-muted-foreground leading-relaxed mt-4">
                  Cuando usas Google Maps en nuestra plataforma para geolocalización de proyectos:
                </p>
                <ul className="list-disc list-inside space-y-2 text-muted-foreground ml-4">
                  <li><strong>Datos de Ubicación de Proyectos:</strong> Coordenadas GPS, direcciones, información geográfica que ingresas para tus proyectos</li>
                  <li><strong>Datos de Visualización de Mapas:</strong> Interacciones con mapas, zoom, búsquedas de ubicación</li>
                </ul>
              </section>

              {/* Data Usage */}
              <section data-section="data-usage" className="space-y-4">
                <h2 className="text-2xl font-semibold tracking-tight">
                  Cómo Usamos tus Datos
                </h2>
                <p className="text-muted-foreground leading-relaxed">
                  Utilizamos la información que recopilamos para los siguientes propósitos:
                </p>

                <h3 className="text-xl font-medium mt-6">Provisión del Servicio</h3>
                <ul className="list-disc list-inside space-y-2 text-muted-foreground ml-4">
                  <li>Crear y gestionar tu cuenta de usuario</li>
                  <li>Autenticar tu identidad cuando inicias sesión</li>
                  <li>Proporcionar acceso a las funciones y módulos de la plataforma</li>
                  <li>Procesar y almacenar tus datos de proyectos, documentos y contenido</li>
                  <li>Facilitar la colaboración con otros miembros de tu organización</li>
                  <li>Generar reportes, análisis y visualizaciones de tus datos</li>
                </ul>

                <h3 className="text-xl font-medium mt-6">Mejora del Servicio</h3>
                <ul className="list-disc list-inside space-y-2 text-muted-foreground ml-4">
                  <li>Analizar patrones de uso para optimizar la experiencia del usuario</li>
                  <li>Desarrollar nuevas funciones y mejoras</li>
                  <li>Realizar pruebas A/B y estudios de usabilidad</li>
                  <li>Entrenar y mejorar nuestros modelos de inteligencia artificial</li>
                  <li>Identificar y solucionar problemas técnicos</li>
                </ul>

                <h3 className="text-xl font-medium mt-6">Comunicación</h3>
                <ul className="list-disc list-inside space-y-2 text-muted-foreground ml-4">
                  <li>Enviarte notificaciones importantes sobre tu cuenta</li>
                  <li>Responder a tus consultas y solicitudes de soporte</li>
                  <li>Enviarte actualizaciones sobre el servicio y nuevas funciones</li>
                  <li>Comunicaciones de marketing (solo si aceptaste recibirlas)</li>
                </ul>

                <h3 className="text-xl font-medium mt-6">Transacciones y Pagos</h3>
                <ul className="list-disc list-inside space-y-2 text-muted-foreground ml-4">
                  <li>Procesar pagos por suscripciones y cursos</li>
                  <li>Generar facturas y comprobantes</li>
                  <li>Prevenir fraude y actividades no autorizadas</li>
                  <li>Gestionar reembolsos cuando sea aplicable</li>
                </ul>

                <h3 className="text-xl font-medium mt-6">Cumplimiento Legal y Seguridad</h3>
                <ul className="list-disc list-inside space-y-2 text-muted-foreground ml-4">
                  <li>Cumplir con obligaciones legales y regulatorias</li>
                  <li>Proteger la seguridad de la plataforma y los usuarios</li>
                  <li>Prevenir uso indebido, fraude o actividades ilegales</li>
                  <li>Hacer cumplir nuestros Términos de Servicio</li>
                </ul>
              </section>

              {/* Data Sharing */}
              <section data-section="data-sharing" className="space-y-4">
                <h2 className="text-2xl font-semibold tracking-tight">
                  Compartir Datos con Terceros
                </h2>
                <p className="text-muted-foreground leading-relaxed">
                  <strong>Política General:</strong> No vendemos ni alquilamos tu información 
                  personal a terceros. Solo compartimos datos en las siguientes circunstancias limitadas:
                </p>

                <h3 className="text-xl font-medium mt-6">Proveedores de Servicios</h3>
                <p className="text-muted-foreground leading-relaxed">
                  Compartimos información con proveedores de servicios que nos ayudan a operar 
                  nuestra plataforma. Estos proveedores tienen acceso limitado a tus datos solo 
                  para realizar servicios específicos en nuestro nombre:
                </p>
                <ul className="list-disc list-inside space-y-2 text-muted-foreground ml-4">
                  <li><strong>Supabase:</strong> Autenticación de usuarios y almacenamiento de datos (ubicado en la región que corresponda a tu ubicación)</li>
                  <li><strong>Neon Database:</strong> Almacenamiento de base de datos PostgreSQL</li>
                  <li><strong>Vercel:</strong> Hosting y entrega de contenido (CDN)</li>
                  <li><strong>OpenAI:</strong> Procesamiento de consultas al asistente de IA (datos anonimizados)</li>
                  <li><strong>Google Maps Platform:</strong> Servicios de geolocalización y mapas</li>
                  <li><strong>Mercado Pago:</strong> Procesamiento de pagos en ARS (Argentina)</li>
                  <li><strong>PayPal:</strong> Procesamiento de pagos en USD</li>
                  <li><strong>Vimeo:</strong> Hosting y streaming de videos educativos</li>
                  <li><strong>Twilio:</strong> Envío de notificaciones por WhatsApp (si está habilitado)</li>
                </ul>

                <h3 className="text-xl font-medium mt-6">Dentro de tu Organización</h3>
                <p className="text-muted-foreground leading-relaxed">
                  Cuando formas parte de una organización en Seencel, los datos de proyectos, 
                  documentos y actividades son compartidos con otros miembros autorizados de tu 
                  organización según los permisos establecidos por los administradores.
                </p>

                <h3 className="text-xl font-medium mt-6">Requisitos Legales</h3>
                <p className="text-muted-foreground leading-relaxed">
                  Podemos divulgar tu información si es requerido por ley, orden judicial, 
                  o proceso legal, o si creemos de buena fe que la divulgación es necesaria para:
                </p>
                <ul className="list-disc list-inside space-y-2 text-muted-foreground ml-4">
                  <li>Cumplir con leyes aplicables o responder a solicitudes gubernamentales válidas</li>
                  <li>Proteger los derechos, propiedad o seguridad de Seencel, nuestros usuarios u otros</li>
                  <li>Prevenir fraude, abuso o violaciones de nuestros Términos de Servicio</li>
                </ul>

                <h3 className="text-xl font-medium mt-6">Transferencias Corporativas</h3>
                <p className="text-muted-foreground leading-relaxed">
                  En caso de fusión, adquisición, venta de activos o similar, tu información puede 
                  ser transferida. Te notificaremos antes de que tu información esté sujeta a una 
                  política de privacidad diferente.
                </p>
              </section>

              {/* Data Storage */}
              <section data-section="data-storage" className="space-y-4">
                <h2 className="text-2xl font-semibold tracking-tight">
                  Almacenamiento y Protección de Datos
                </h2>

                <h3 className="text-xl font-medium mt-6">Ubicación del Almacenamiento</h3>
                <p className="text-muted-foreground leading-relaxed">
                  Tus datos se almacenan en servidores seguros ubicados en centros de datos certificados. 
                  Utilizamos Neon Database (PostgreSQL serverless) que opera en infraestructura cloud 
                  con alta disponibilidad y redundancia geográfica.
                </p>

                <h3 className="text-xl font-medium mt-6">Cifrado de Datos</h3>
                <ul className="list-disc list-inside space-y-2 text-muted-foreground ml-4">
                  <li><strong>En Tránsito:</strong> Todos los datos transmitidos entre tu dispositivo y nuestros servidores están cifrados usando TLS/SSL (HTTPS)</li>
                  <li><strong>En Reposo:</strong> Los datos almacenados en nuestra base de datos están cifrados utilizando estándares de la industria</li>
                  <li><strong>Contraseñas:</strong> Las contraseñas se almacenan con hash usando bcrypt, nunca en texto plano</li>
                  <li><strong>Tokens de Acceso:</strong> Los tokens de sesión y API keys se almacenan de forma segura y tienen tiempos de expiración</li>
                </ul>

                <h3 className="text-xl font-medium mt-6">Acceso Controlado</h3>
                <p className="text-muted-foreground leading-relaxed">
                  Implementamos controles de acceso estrictos:
                </p>
                <ul className="list-disc list-inside space-y-2 text-muted-foreground ml-4">
                  <li>Row Level Security (RLS) en la base de datos para aislar datos por usuario/organización</li>
                  <li>Autenticación multi-factor disponible para cuentas</li>
                  <li>Auditoría de accesos y actividades sospechosas</li>
                  <li>Acceso limitado del personal de Seencel solo cuando es necesario para soporte</li>
                </ul>

                <h3 className="text-xl font-medium mt-6">Respaldo y Recuperación</h3>
                <p className="text-muted-foreground leading-relaxed">
                  Realizamos respaldos automáticos regulares de todos los datos para prevenir pérdida 
                  de información. Los respaldos están cifrados y almacenados en múltiples ubicaciones geográficas.
                </p>
              </section>

              {/* Data Retention */}
              <section data-section="data-retention" className="space-y-4">
                <h2 className="text-2xl font-semibold tracking-tight">
                  Retención y Eliminación de Datos
                </h2>

                <h3 className="text-xl font-medium mt-6">Política de Retención</h3>
                <p className="text-muted-foreground leading-relaxed">
                  Conservamos tu información personal mientras tu cuenta esté activa o sea necesario 
                  para proporcionarte servicios. Los períodos específicos de retención son:
                </p>
                <ul className="list-disc list-inside space-y-2 text-muted-foreground ml-4">
                  <li><strong>Datos de Cuenta:</strong> Mientras tu cuenta esté activa, más 30 días después de la eliminación</li>
                  <li><strong>Datos de Proyectos:</strong> Mientras tu organización esté activa, según lo determines tú o tu organización</li>
                  <li><strong>Datos Transaccionales:</strong> Mínimo 5 años por requisitos legales y contables</li>
                  <li><strong>Logs del Sistema:</strong> 90 días para propósitos de seguridad y debugging</li>
                  <li><strong>Datos de Marketing:</strong> Hasta que retires tu consentimiento o 2 años de inactividad</li>
                  <li><strong>Respaldos:</strong> 30 días en respaldos automáticos</li>
                </ul>

                <h3 className="text-xl font-medium mt-6">Proceso de Eliminación</h3>
                <p className="text-muted-foreground leading-relaxed">
                  Puedes solicitar la eliminación de tus datos en cualquier momento:
                </p>
                <ul className="list-disc list-inside space-y-2 text-muted-foreground ml-4">
                  <li><strong>Desde tu Cuenta:</strong> Puedes eliminar tu cuenta directamente desde la configuración de perfil</li>
                  <li><strong>Por Correo Electrónico:</strong> Envía una solicitud a <a href="mailto:privacy@seencel.com" className="text-accent hover:underline">privacy@seencel.com</a></li>
                  <li><strong>Tiempo de Procesamiento:</strong> Procesamos solicitudes de eliminación dentro de 30 días</li>
                  <li><strong>Eliminación Permanente:</strong> Los datos eliminados no pueden ser recuperados</li>
                </ul>
                <p className="text-muted-foreground leading-relaxed mt-4">
                  <strong>Excepciones:</strong> Podemos retener cierta información si es requerido por ley 
                  (ej: registros fiscales), o si hay disputas legales pendientes.
                </p>

                <h3 className="text-xl font-medium mt-6">Exportación de Datos</h3>
                <p className="text-muted-foreground leading-relaxed">
                  Antes de eliminar tu cuenta, puedes solicitar una exportación de tus datos en formato 
                  portable (JSON/CSV). Esto incluye toda tu información personal, proyectos, documentos 
                  y actividades.
                </p>
              </section>

              {/* Your Rights */}
              <section data-section="your-rights" className="space-y-4">
                <h2 className="text-2xl font-semibold tracking-tight">
                  Tus Derechos de Privacidad
                </h2>
                <p className="text-muted-foreground leading-relaxed">
                  Dependiendo de tu ubicación, puedes tener los siguientes derechos respecto a tus datos personales:
                </p>

                <h3 className="text-xl font-medium mt-6">Derecho de Acceso</h3>
                <p className="text-muted-foreground leading-relaxed">
                  Tienes derecho a solicitar y obtener confirmación de si procesamos tus datos personales 
                  y acceder a una copia de los mismos.
                </p>

                <h3 className="text-xl font-medium mt-6">Derecho de Rectificación</h3>
                <p className="text-muted-foreground leading-relaxed">
                  Puedes corregir datos personales inexactos o incompletos directamente desde tu perfil 
                  o solicitando asistencia.
                </p>

                <h3 className="text-xl font-medium mt-6">Derecho de Eliminación</h3>
                <p className="text-muted-foreground leading-relaxed">
                  Puedes solicitar que eliminemos tus datos personales en ciertas circunstancias, sujeto 
                  a excepciones legales.
                </p>

                <h3 className="text-xl font-medium mt-6">Derecho a Restricción del Procesamiento</h3>
                <p className="text-muted-foreground leading-relaxed">
                  Puedes solicitar que limitemos el procesamiento de tus datos en ciertas situaciones.
                </p>

                <h3 className="text-xl font-medium mt-6">Derecho a la Portabilidad</h3>
                <p className="text-muted-foreground leading-relaxed">
                  Puedes solicitar una copia de tus datos en formato estructurado y de uso común para 
                  transferirlos a otro servicio.
                </p>

                <h3 className="text-xl font-medium mt-6">Derecho de Oposición</h3>
                <p className="text-muted-foreground leading-relaxed">
                  Puedes oponerte al procesamiento de tus datos con fines de marketing directo en cualquier momento.
                </p>

                <h3 className="text-xl font-medium mt-6">Derecho a Retirar Consentimiento</h3>
                <p className="text-muted-foreground leading-relaxed">
                  Cuando procesamos datos basados en tu consentimiento, puedes retirarlo en cualquier momento 
                  sin afectar la legalidad del procesamiento anterior.
                </p>

                <h3 className="text-xl font-medium mt-6">Cómo Ejercer tus Derechos</h3>
                <p className="text-muted-foreground leading-relaxed">
                  Para ejercer cualquiera de estos derechos, contáctanos en{" "}
                  <a href="mailto:privacy@seencel.com" className="text-accent hover:underline">
                    privacy@seencel.com
                  </a>
                  . Responderemos a tu solicitud dentro de 30 días.
                </p>
              </section>

              {/* Security */}
              <section data-section="security" className="space-y-4">
                <h2 className="text-2xl font-semibold tracking-tight">
                  Medidas de Seguridad
                </h2>
                <p className="text-muted-foreground leading-relaxed">
                  Implementamos medidas técnicas y organizativas apropiadas para proteger tus datos:
                </p>
                <ul className="list-disc list-inside space-y-2 text-muted-foreground ml-4">
                  <li><strong>Cifrado:</strong> TLS/SSL para datos en tránsito, cifrado en reposo para datos almacenados</li>
                  <li><strong>Autenticación:</strong> Sistema de autenticación robusto con Supabase Auth, soporte para OAuth de Google</li>
                  <li><strong>Control de Acceso:</strong> Row Level Security (RLS) y permisos granulares basados en roles</li>
                  <li><strong>Monitoreo:</strong> Sistemas de detección de intrusiones y monitoreo continuo de seguridad</li>
                  <li><strong>Respaldos:</strong> Respaldos automáticos cifrados en múltiples ubicaciones</li>
                  <li><strong>Auditorías:</strong> Revisiones regulares de seguridad y pruebas de vulnerabilidad</li>
                  <li><strong>Capacitación:</strong> Nuestro equipo recibe capacitación continua en mejores prácticas de seguridad</li>
                  <li><strong>Respuesta a Incidentes:</strong> Plan de respuesta a incidentes de seguridad 24/7</li>
                </ul>
                <p className="text-muted-foreground leading-relaxed mt-4">
                  Si bien tomamos todas las medidas razonables, ningún sistema es 100% seguro. Te recomendamos 
                  usar contraseñas fuertes y únicas, y nunca compartir tus credenciales.
                </p>
              </section>

              {/* Third Party Services */}
              <section data-section="third-party" className="space-y-4">
                <h2 className="text-2xl font-semibold tracking-tight">
                  Servicios de Terceros
                </h2>
                <p className="text-muted-foreground leading-relaxed">
                  Nuestra plataforma integra servicios de terceros. Cada servicio tiene su propia 
                  política de privacidad que te recomendamos revisar:
                </p>
                <ul className="list-disc list-inside space-y-2 text-muted-foreground ml-4">
                  <li><strong>Google (OAuth, Maps):</strong>{" "}
                    <a href="https://policies.google.com/privacy" target="_blank" rel="noopener noreferrer" className="text-accent hover:underline">
                      Política de Privacidad de Google
                    </a>
                  </li>
                  <li><strong>Supabase (Auth, Database):</strong>{" "}
                    <a href="https://supabase.com/privacy" target="_blank" rel="noopener noreferrer" className="text-accent hover:underline">
                      Política de Privacidad de Supabase
                    </a>
                  </li>
                  <li><strong>OpenAI (IA):</strong>{" "}
                    <a href="https://openai.com/policies/privacy-policy" target="_blank" rel="noopener noreferrer" className="text-accent hover:underline">
                      Política de Privacidad de OpenAI
                    </a>
                  </li>
                  <li><strong>Mercado Pago (Pagos):</strong>{" "}
                    <a href="https://www.mercadopago.com.ar/privacidad" target="_blank" rel="noopener noreferrer" className="text-accent hover:underline">
                      Política de Privacidad de Mercado Pago
                    </a>
                  </li>
                  <li><strong>PayPal (Pagos):</strong>{" "}
                    <a href="https://www.paypal.com/privacy" target="_blank" rel="noopener noreferrer" className="text-accent hover:underline">
                      Política de Privacidad de PayPal
                    </a>
                  </li>
                  <li><strong>Vimeo (Videos):</strong>{" "}
                    <a href="https://vimeo.com/privacy" target="_blank" rel="noopener noreferrer" className="text-accent hover:underline">
                      Política de Privacidad de Vimeo
                    </a>
                  </li>
                </ul>
                <p className="text-muted-foreground leading-relaxed mt-4">
                  No somos responsables por las prácticas de privacidad de terceros. El uso de estos 
                  servicios está sujeto a sus propios términos y condiciones.
                </p>
              </section>

              {/* Children */}
              <section data-section="children" className="space-y-4">
                <h2 className="text-2xl font-semibold tracking-tight">
                  Privacidad de Menores
                </h2>
                <p className="text-muted-foreground leading-relaxed">
                  Nuestros servicios no están dirigidos a menores de 18 años. No recopilamos 
                  intencionalmente información personal de menores. Si descubrimos que hemos 
                  recopilado datos de un menor sin consentimiento parental verificable, tomaremos 
                  medidas para eliminar esa información lo antes posible.
                </p>
                <p className="text-muted-foreground leading-relaxed mt-4">
                  Si eres padre o tutor y crees que tu hijo nos ha proporcionado información personal, 
                  contáctanos en{" "}
                  <a href="mailto:privacy@seencel.com" className="text-accent hover:underline">
                    privacy@seencel.com
                  </a>
                  .
                </p>
              </section>

              {/* Changes */}
              <section data-section="changes" className="space-y-4">
                <h2 className="text-2xl font-semibold tracking-tight">
                  Cambios a esta Política
                </h2>
                <p className="text-muted-foreground leading-relaxed">
                  Podemos actualizar esta Política de Privacidad periódicamente para reflejar cambios 
                  en nuestras prácticas o por razones legales, operativas o regulatorias.
                </p>
                <p className="text-muted-foreground leading-relaxed mt-4">
                  Cuando realicemos cambios materiales, te notificaremos por:
                </p>
                <ul className="list-disc list-inside space-y-2 text-muted-foreground ml-4">
                  <li>Correo electrónico a la dirección asociada a tu cuenta</li>
                  <li>Notificación destacada en nuestra plataforma</li>
                  <li>Actualización de la fecha "Última actualización" en la parte superior de esta página</li>
                </ul>
                <p className="text-muted-foreground leading-relaxed mt-4">
                  Te recomendamos revisar esta política periódicamente. El uso continuado de nuestros 
                  servicios después de cambios constituye tu aceptación de la política actualizada.
                </p>
              </section>

              {/* Contact */}
              <section data-section="contact" className="space-y-4">
                <h2 className="text-2xl font-semibold tracking-tight">
                  Contacto
                </h2>
                <p className="text-muted-foreground leading-relaxed">
                  Si tienes preguntas, comentarios o inquietudes sobre esta Política de Privacidad 
                  o nuestras prácticas de datos, contáctanos:
                </p>
                <div className="mt-4 space-y-3 text-muted-foreground">
                  <p>
                    <strong>Correo Electrónico de Privacidad:</strong>{" "}
                    <a href="mailto:privacy@seencel.com" className="text-accent hover:underline">
                      privacy@seencel.com
                    </a>
                  </p>
                  <p>
                    <strong>Correo General:</strong>{" "}
                    <a href="mailto:contacto@seencel.com" className="text-accent hover:underline">
                      contacto@seencel.com
                    </a>
                  </p>
                  <p>
                    <strong>Sitio Web:</strong>{" "}
                    <a href="https://seencel.com" target="_blank" rel="noopener noreferrer" className="text-accent hover:underline">
                      seencel.com
                    </a>
                  </p>
                </div>
                <p className="text-muted-foreground leading-relaxed mt-4">
                  Nos comprometemos a responder a todas las consultas dentro de 5 días hábiles.
                </p>
              </section>
            </div>

            {/* Footer note */}
            <div className="pt-12 pb-6 border-t">
              <p className="text-sm text-muted-foreground">
                Esta Política de Privacidad fue actualizada por última vez en Noviembre de 2025.
              </p>
            </div>
          </main>

          {/* Table of Contents - Sticky Sidebar */}
          <aside className="hidden lg:block w-64 flex-shrink-0">
            <div className="sticky top-24 space-y-2">
              <p className="font-semibold text-sm mb-4">En esta página</p>
              <nav className="space-y-1.5">
                {sections.map((section) => (
                  <button
                    key={section.id}
                    onClick={() => scrollToSection(section.id)}
                    className={cn(
                      "block w-full text-left text-sm px-3 py-1.5 rounded-md transition-colors",
                      activeSection === section.id
                        ? "bg-accent/10 text-accent font-medium"
                        : "text-muted-foreground hover:text-foreground hover:bg-muted"
                    )}
                  >
                    {section.label}
                  </button>
                ))}
              </nav>
            </div>
          </aside>
      </div>

      {/* Scroll to Top Button */}
      {showScrollTop && (
        <Button
          onClick={scrollToTop}
          size="icon"
          className="fixed bottom-8 right-8 rounded-full shadow-lg z-50"
          data-testid="button-scroll-top"
        >
          <ArrowUp className="h-5 w-5" />
        </Button>
      )}
    </PublicLayout>
  );
}
