import { 
  TrendingUp, 
  Users, 
  AlertTriangle, 
  Package, 
  Sun, 
  Cloud, 
  CloudRain, 
  CloudSnow, 
  Wind, 
  CloudDrizzle, 
  CloudLightning, 
  CheckCircle, 
  Search, 
  Camera, 
  StickyNote, 
  CloudSun,
  type LucideIcon
} from "lucide-react";

export interface EntryTypeConfig {
  icon: LucideIcon;
  label: string;
  color: string;
}

export interface WeatherTypeConfig {
  icon: LucideIcon;
  label: string;
}

export const ENTRY_TYPES: Record<string, EntryTypeConfig> = {
  avance_de_obra: { 
    icon: TrendingUp, 
    label: "Avance de obra", 
    color: "bg-green-100 text-green-800" 
  },
  visita_tecnica: { 
    icon: Users, 
    label: "Visita técnica", 
    color: "bg-blue-100 text-blue-800" 
  },
  problema_detectado: { 
    icon: AlertTriangle, 
    label: "Problema detectado", 
    color: "bg-red-100 text-red-800" 
  },
  pedido_material: { 
    icon: Package, 
    label: "Pedido material", 
    color: "bg-orange-100 text-orange-800" 
  },
  nota_climatica: { 
    icon: Sun, 
    label: "Nota climática", 
    color: "bg-yellow-100 text-yellow-800" 
  },
  decision: { 
    icon: CheckCircle, 
    label: "Decisión", 
    color: "bg-purple-100 text-purple-800" 
  },
  inspeccion: { 
    icon: Search, 
    label: "Inspección", 
    color: "bg-indigo-100 text-indigo-800" 
  },
  foto_diaria: { 
    icon: Camera, 
    label: "Foto diaria", 
    color: "bg-gray-100 text-gray-800" 
  },
  registro_general: { 
    icon: StickyNote, 
    label: "Registro general", 
    color: "bg-teal-100 text-teal-800" 
  }
} as const;

export const WEATHER_TYPES: Record<string, WeatherTypeConfig> = {
  sunny: { icon: Sun, label: "Soleado" },
  partly_cloudy: { icon: CloudSun, label: "Parcialmente nublado" },
  cloudy: { icon: Cloud, label: "Nublado" },
  rain: { icon: CloudRain, label: "Lluvia" },
  storm: { icon: CloudLightning, label: "Tormenta" },
  snow: { icon: CloudSnow, label: "Nieve" },
  fog: { icon: CloudDrizzle, label: "Niebla" },
  windy: { icon: Wind, label: "Ventoso" },
  hail: { icon: CloudSnow, label: "Granizo" }
} as const;

export const ENTRY_TYPE_OPTIONS = [
  { value: "avance_de_obra", label: "Avance de obra" },
  { value: "visita_tecnica", label: "Visita técnica" },
  { value: "problema_detectado", label: "Problema detectado" },
  { value: "pedido_material", label: "Pedido material" },
  { value: "nota_climatica", label: "Nota climática" },
  { value: "decision", label: "Decisión" },
  { value: "inspeccion", label: "Inspección" },
  { value: "foto_diaria", label: "Foto diaria" },
  { value: "registro_general", label: "Registro general" }
] as const;

export const SEVERITY_OPTIONS = [
  { value: 'low', label: 'Baja' },
  { value: 'medium', label: 'Media' },
  { value: 'high', label: 'Alta' },
  { value: 'critical', label: 'Crítica' }
] as const;

export const STATUS_OPTIONS = [
  { value: 'pending', label: 'Pendiente' },
  { value: 'review', label: 'En revisión' },
  { value: 'approved', label: 'Aprobado' },
  { value: 'closed', label: 'Cerrado' }
] as const;

export const WEATHER_OPTIONS = [
  { value: 'sunny', label: 'Soleado' },
  { value: 'partly_cloudy', label: 'Parcialmente nublado' },
  { value: 'cloudy', label: 'Nublado' },
  { value: 'rain', label: 'Lluvia' },
  { value: 'storm', label: 'Tormenta' },
  { value: 'snow', label: 'Nieve' },
  { value: 'fog', label: 'Niebla' },
  { value: 'windy', label: 'Ventoso' },
  { value: 'hail', label: 'Granizo' },
  { value: 'none', label: 'N/A' }
] as const;
