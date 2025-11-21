export type WeatherType = 'sunny' | 'partly_cloudy' | 'cloudy' | 'rain' | 'storm' | 'snow' | 'fog' | 'windy' | 'hail' | 'none';

export type SeverityLevel = 'low' | 'medium' | 'high' | 'critical';

export type SiteLogStatus = 'pending' | 'review' | 'approved' | 'closed';

export type TimePeriod = 'days' | 'weeks' | 'months';

export type ActivityTimePeriod = 'week' | 'month' | 'year';

export interface SiteLogFileInput {
  file: File;
  title: string;
  description?: string;
}

/**
 * Archivo de galería de bitácora con toda la información necesaria para mostrar en UI
 */
export interface SitelogGalleryFile {
  // Media file info
  id: string;
  file_url: string;
  file_name: string;
  file_type: string;
  file_size: number | null;
  file_path: string;
  bucket: string;
  is_deleted: boolean;
  
  // Link info
  link_id: string;
  project_id: string;
  project_name: string;
  site_log_id: string;
  organization_id: string;
  visibility: string;
  description: string | null;
  category: string | null;
  is_cover: boolean;
  position: number | null;
  created_at: string;
  created_by: string;
  
  // Site log context
  site_log: {
    id: string;
    date: string;
    description: string | null;
    type_name: string;
  };
}

export interface SiteLogAttendee {
  id: string;
  contact_id: string;
  contact_type: string;
  arrival_time?: string;
  departure_time?: string;
  notes?: string;
}

export interface SiteLog {
  id: string;
  log_date: string;
  is_public: boolean;
  entry_type_id: string;
  weather?: WeatherType | null;
  severity: SeverityLevel;
  status?: SiteLogStatus | null;
  comments?: string;
  created_by: string;
  created_at: string;
  updated_at?: string;
  organization_id: string;
  project_id: string;
}

export interface SiteLogTimelineData {
  date: string;
  files: number;
  attendees: number;
}

export interface SiteLogActivityUser {
  user_id: string;
  full_name: string;
  avatar_url?: string;
  activity_count: number;
}

export interface SiteLogActivity {
  date: string;
  users: SiteLogActivityUser[];
  total: number;
}

export interface AttendeeData {
  id: string;
  personnel_id: string;
  contact_id: string;
  contact_type: string;
  attendance_type: 'full' | 'half';
  hours_worked: number;
  description: string;
  arrival_time: string;
  departure_time: string;
  notes: string;
}
