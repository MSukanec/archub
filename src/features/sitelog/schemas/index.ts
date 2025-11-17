import { z } from "zod";

export const siteLogEventSchema = z.object({
  id: z.string(),
  description: z.string(),
  time: z.string(),
  responsible: z.string().optional()
});

export const siteLogAttendeeSchema = z.object({
  id: z.string(),
  contact_id: z.string(),
  contact_type: z.string(),
  arrival_time: z.string().optional(),
  departure_time: z.string().optional(),
  notes: z.string().optional()
});

export const siteLogEquipmentSchema = z.object({
  id: z.string(),
  name: z.string(),
  quantity: z.number(),
  condition: z.string().optional(),
  operator: z.string().optional(),
  notes: z.string().optional()
});

export const siteLogSchema = z.object({
  log_date: z.string().min(1, "La fecha es requerida"),
  is_public: z.boolean().default(false),
  entry_type_id: z.string().min(1, "El tipo de bitácora es requerido"),
  weather: z.enum(['sunny', 'partly_cloudy', 'cloudy', 'rain', 'storm', 'snow', 'fog', 'windy', 'hail', 'none']).nullable().optional(),
  severity: z.enum(['low', 'medium', 'high', 'critical'], { required_error: "La severidad es requerida" }),
  status: z.enum(['pending', 'review', 'approved', 'closed']).nullable().optional(),
  comments: z.string().optional(),
  files: z.array(z.string()).optional().default([]),
  events: z.array(siteLogEventSchema).optional().default([]),
  attendees: z.array(siteLogAttendeeSchema).optional().default([]),
  equipment: z.array(siteLogEquipmentSchema).optional().default([])
});

export type SiteLogFormData = z.infer<typeof siteLogSchema>;
export type SiteLogEventFormData = z.infer<typeof siteLogEventSchema>;
export type SiteLogAttendeeFormData = z.infer<typeof siteLogAttendeeSchema>;
export type SiteLogEquipmentFormData = z.infer<typeof siteLogEquipmentSchema>;
