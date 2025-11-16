import { useState, useEffect, useMemo } from "react";
import { format, parseISO, isSameDay } from "date-fns";
import { useImageLightbox, ImageLightbox } from "@/components/ui-custom/media/ImageLightbox";
import { DateSeparator } from "./DateSeparator";
import { LogEntryCard } from "./LogEntryCard";

interface LogTimelineProps {
  siteLogs: any[];
  toggleFavorite: (siteLogId: string) => void;
  handleDeleteSiteLog: (siteLog: any) => void;
}

export function LogTimeline({ 
  siteLogs, 
  toggleFavorite, 
  handleDeleteSiteLog 
}: LogTimelineProps) {
  const [expandedLogId, setExpandedLogId] = useState<string | null>(null);

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

  // Auto-expand the most recent entry when data loads
  useEffect(() => {
    if (siteLogs && siteLogs.length > 0 && !expandedLogId) {
      setExpandedLogId(siteLogs[0].id);
    }
  }, [siteLogs, expandedLogId]);

  // Initialize lightbox with all images from all logs
  const imageUrls = siteLogs.flatMap((log: any) => 
    log.files?.filter((file: any) => file.file_type === 'image').map((file: any) => file.file_url) || []
  );
  const lightbox = useImageLightbox(imageUrls);

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
                  isExpanded={expandedLogId === siteLog.id}
                  onToggleExpand={(expanded) => setExpandedLogId(expanded ? siteLog.id : null)}
                  toggleFavorite={toggleFavorite}
                  handleDeleteSiteLog={handleDeleteSiteLog}
                  imageUrls={imageUrls}
                  lightbox={lightbox}
                />
              ))}
            </div>
          </div>
        ))}
      </div>
      <ImageLightbox 
        images={imageUrls}
        currentIndex={lightbox.currentIndex}
        isOpen={lightbox.isOpen}
        onClose={lightbox.closeLightbox}
      />
    </>
  );
}
