import { Link } from "wouter";

export const pricingFAQs = [
  {
    q: "¿Qué es la insignia de Fundador y qué incluye?",
    a: () => (
      <div>
        La insignia de Fundador es un reconocimiento exclusivo y permanente que obtienes al suscribirse a cualquier plan anual durante este período de lanzamiento limitado. Es visible en tu perfil como muestra de tu apoyo inicial a Seencel. Los beneficios incluyen: acceso anticipado a nuevas funcionalidades antes que otros usuarios, membresía en el grupo privado de fundadores para networking e intercambio de conocimiento, y descuentos permanentes (10% en renovaciones de suscripción y 20% en cursos) que se mantienen de por vida, incluso si cambias de plan. Si eres fundador en Pro y luego asciendes a Teams, la insignia y todos los beneficios se transfieren y se extienden a todos los miembros actuales y futuros de tu organización.
      </div>
    )
  },
  {
    q: "¿Puedo cambiar de plan en cualquier momento?",
    a: () => (
      <div>
        Sí, puedes actualizar, degradar o cambiar entre planes en cualquier momento sin penalidades. Cuando cambias de plan en medio de un ciclo de facturación, aplicamos prorrateo automático: si actualizas a un plan superior, tu próxima facturación reflejará el costo proporcional del tiempo restante al nuevo precio. Si degradas a un plan inferior, se acumula un crédito que se aplica a tu próxima facturación. No pierdes datos ni acceso: el cambio se aplica inmediatamente.
      </div>
    )
  },
  {
    q: "¿Cómo funcionan los créditos de IA?",
    a: () => (
      <div>
        Los créditos de IA (también llamados 'tokens') son unidades de consumo que utilizas cada vez que interactúas con las funciones de inteligencia artificial de Seencel. Se consumen tanto en consultas pasivas (como pedir análisis de un presupuesto o resumen de documentos) como en acciones automáticas (como sugerencias de optimización o análisis financiero automático). El plan Free incluye créditos limitados ideales para explorar funciones de IA. Pro y Teams incluyen límites mensuales más generosos que se renuevan cada período de facturación. Los créditos no utilizados en un mes no se acumulan para el siguiente.
      </div>
    )
  },
  {
    q: "¿Qué métodos de pago aceptan?",
    a: () => (
      <div>
        Aceptamos múltiples métodos de pago para tu conveniencia: tarjetas de crédito y débito (Visa, Mastercard, American Express), PayPal para pagos internacionales, Mercado Pago para Argentina, y transferencias bancarias. Si eres Enterprise, ofrecemos facturación personalizada con términos negociables. <Link href="/contact" className="text-accent hover:underline">Contacta con nuestro equipo</Link> para más detalles sobre opciones de facturación personalizada.
      </div>
    )
  },
  {
    q: "¿Qué sucede con mis datos si cancelo la suscripción?",
    a: () => (
      <div>
        Tus datos se conservan en nuestros servidores durante 90 días después de la cancelación, lo que te permite reactivar tu cuenta sin perder información. Pasados 90 días, los datos se eliminan permanentemente. Puedes exportar tus datos en cualquier momento antes de la cancelación.
      </div>
    )
  },
  {
    q: "¿Puedo cambiar entre facturación mensual y anual?",
    a: () => (
      <div>
        Sí. Puedes cambiar tu ciclo de facturación en cualquier momento desde la configuración de tu plan. Si pasas de mensual a anual, se aplica un ajuste de precio en tu próxima facturación. Si pasas de anual a mensual, el cambio toma efecto al final de tu ciclo anual actual.
      </div>
    )
  },
  {
    q: "¿Qué sucede con mi equipo si cambio de plan?",
    a: () => (
      <div>
        Para el plan Free (1 usuario), solo tú tienes acceso. En Pro (1 usuario) también es individual pero con más capacidades. En Teams (usuarios ilimitados), puedes agregar miembros y asignarles roles con permisos específicos. Si degradas desde Teams a Pro o Free, los miembros adicionales pierden acceso automáticamente, pero sus datos se preservan por si reinvitas a más usuarios después.
      </div>
    )
  },
  {
    q: "¿Qué es el plan Enterprise y para quién es?",
    a: () => (
      <div>
        El plan Enterprise está diseñado para grandes organizaciones que necesitan una solución personalizada. Incluye: usuarios ilimitados sin costo adicional por asiento, implementación on-premise si es necesario, SSO con tu proveedor de identidad, capacitación personalizada para tu equipo, un gerente de cuenta dedicado, y SLA del 99.9% con soporte prioritario 24/7. Esto es ideal para constructoras con más de 50 empleados o desarrolladoras inmobiliarias que manejan múltiples proyectos simultáneamente. Para conocer precios y opciones, <Link href="/contact" className="text-accent hover:underline">contacta con nuestro equipo de ventas</Link>.
      </div>
    )
  }
];
