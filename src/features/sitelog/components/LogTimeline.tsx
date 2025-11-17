import { useMemo } from "react";
import { format, parseISO } from "date-fns";
import { useMediaLightbox, MediaLightbox, type MediaItem } from "@/components/ui-custom/media/ImageLightbox";
import { DateSeparator } from "./DateSeparator";
import { LogEntryCard } from "./LogEntryCard";

interface LogTimelineProps {
  siteLogs: any[];
  toggleFavorite: (siteLogId: string) => void;
  handleEditSiteLog: (siteLog: any) => void;
  handleDeleteSiteLog: (siteLog: any) => void;
}

export function LogTimeline({ 
  siteLogs, 
  toggleFavorite, 
  handleEditSiteLog,
  handleDeleteSiteLog 
}: LogTimelineProps) {

  // Group logs by date
  const groupedLogs = useMemo(() => {
    const groups: { [key: string]: any[] } = {};
    
    siteLogs.forEach((log) => {
      const dateKey = format(parseISO(log.log_date + 'T00:00:00'), 'yyyy-MM-dd');
      if (!groups[dateKey]) {
        groups[dateKey] = [];
      }
      groups[dateKey].push(log);
    });
    
    // Sort groups by date (most recent first)
    const sortedKeys = Object.keys(groups).sort((a, b) => b.localeCompare(a));
    
    return sortedKeys.map(key => ({
      date: parseISO(key + 'T00:00:00'),
      logs: groups[key]
    }));
  }, [siteLogs]);

  // Initialize lightbox with all images and videos from all logs
  const mediaItems = useMemo(() => {
    return siteLogs.flatMap((log: any) => 
      log.files?.filter((file: any) => file.file_type === 'image' || file.file_type === 'video')
        .map((file: any) => ({
          type: file.file_type as 'image' | 'video',
          src: file.file_url
        })) || []
    );
  }, [siteLogs]);
  
  const lightbox = useMediaLightbox(mediaItems);

  return (
    <>
      <div className="space-y-2">
        {groupedLogs.map(({ date, logs }, groupIndex) => (
          <div key={format(date, 'yyyy-MM-dd')}>
            <DateSeparator date={date} />
            <div className="space-y-3">
              {logs.map((siteLog: any) => (
                <LogEntryCard
                  key={siteLog.id}
                  siteLog={siteLog}
                  isExpanded={false}
                  onToggleExpand={() => {}}
                  toggleFavorite={toggleFavorite}
                  handleEditSiteLog={handleEditSiteLog}
                  handleDeleteSiteLog={handleDeleteSiteLog}
                  mediaItems={mediaItems}
                  lightbox={lightbox}
                />
              ))}
            </div>
          </div>
        ))}
      </div>
      <MediaLightbox 
        media={mediaItems}
        currentIndex={lightbox.currentIndex}
        isOpen={lightbox.isOpen}
        onClose={lightbox.closeLightbox}
      />
    </>
  );
}
