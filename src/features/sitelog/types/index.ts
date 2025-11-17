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
