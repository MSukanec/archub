import {
  Building2,
  GraduationCap,
  MessageSquare,
  FlaskConical,
  Users,
  Award,
  List,
  Crown,
} from "lucide-react";
import type { Benefit } from "../types";

export const benefits: Benefit[] = [
  {
    icon: Building2,
    title: "Beneficio Organizacional",
    description: "El estatus de Fundador aplica a toda tu Organización, no solo a ti. Todos los miembros de tu equipo heredan los beneficios automáticamente."
  },
  {
    icon: GraduationCap,
    title: "Acceso Vitalicio al Bonus de Capacitación",
    description: "Acceso gratuito y permanente al bonus de capacitación incluido en la suscripción. Actualmente: Curso completo de Archicad."
  },
  {
    icon: MessageSquare,
    title: "Voz y Voto en el Roadmap",
    description: "Canal directo con el equipo de desarrollo. Participa en votaciones para priorizar las funcionalidades que más te importan."
  },
  {
    icon: FlaskConical,
    title: "Acceso Anticipado (Modo Lab)",
    description: "Sé el primero en probar nuevas funcionalidades en modo beta antes de su lanzamiento oficial al público."
  },
  {
    icon: Users,
    title: "Comunidad Privada en Discord",
    description: "Acceso exclusivo a un canal privado donde conectar con otros fundadores, compartir experiencias y recibir soporte prioritario."
  },
  {
    icon: Award,
    title: "Insignia de Fundador Pública",
    description: "Una insignia visible en tu perfil que te identifica como miembro fundador de Seencel ante toda la comunidad."
  },
  {
    icon: List,
    title: "Listado de Organizaciones Fundadoras",
    description: "Tu organización será incluida en nuestro directorio público de fundadores, visible en la web de Seencel."
  },
  {
    icon: Crown,
    title: "Estatus Permanente",
    description: "Una vez fundador, siempre fundador. El estatus es vitalicio mientras mantengas tu suscripción activa."
  }
];
