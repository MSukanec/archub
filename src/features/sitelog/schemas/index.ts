import { z } from "zod";
export const siteLogAttendeeSchema = z.object({
  id: z.string(),
  contact_id: z.string(),
  contact_type: z.string(),
  arrival_time: z.string().optional(),
  departure_time: z.string().optional(),
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
  attendees: z.array(siteLogAttendeeSchema).optional().default([])
});
export type SiteLogFormData = z.infer<typeof siteLogSchema>;
export type SiteLogAttendeeFormData = z.infer<typeof siteLogAttendeeSchema>;
