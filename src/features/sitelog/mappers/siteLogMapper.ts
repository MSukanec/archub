import type { SiteLog } from '../types';

export function mapSiteLogFromSupabase(rawData: any): SiteLog {
  return {
    id: rawData.id,
    log_date: rawData.log_date,
    is_public: rawData.is_public,
    entry_type_id: rawData.entry_type_id,
    weather: rawData.weather,
    severity: rawData.severity,
    status: rawData.status,
    comments: rawData.comments,
    created_by: rawData.created_by,
    created_at: rawData.created_at,
    updated_at: rawData.updated_at,
    organization_id: rawData.organization_id,
    project_id: rawData.project_id
  };
}

export function mapSiteLogsWithRelations(
  logs: any[],
  files: any[],
  events: any[],
  attendees: any[]
) {
  return logs.map(log => ({
    ...log,
    creator: log.creator?.user ? {
      id: log.creator.user.id,
      full_name: log.creator.user.full_name,
      avatar_url: log.creator.user.avatar_url
    } : null,
    events: events?.filter(event => event.site_log_id === log.id) || [],
    attendees: attendees?.filter(attendee => attendee.site_log_id === log.id) || [],
    files: files?.filter(file => file.site_log_id === log.id) || []
  }));
}
