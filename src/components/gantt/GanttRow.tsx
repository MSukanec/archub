import { useState } from 'react';
import { GanttLeftPanel } from './GanttLeftPanel';
import { GanttTimelineBar } from './GanttTimelineBar';
import { GanttRowProps } from './types';

interface GanttRowComponentProps {
  item: GanttRowProps;
  timelineStart: Date;
  timelineEnd: Date;
  timelineWidth: number;
  expandedItems: Set<string>;
  onToggleExpand: (id: string) => void;
  onItemClick?: (item: GanttRowProps) => void;
  onAddChild?: (parentId: string) => void;
}

export function GanttRow({ 
  item, 
  timelineStart, 
  timelineEnd, 
  timelineWidth,
  expandedItems,
  onToggleExpand,
  onItemClick,
  onAddChild
}: GanttRowComponentProps) {
  const isExpanded = expandedItems.has(item.id);
  const hasChildren = item.children && item.children.length > 0;

  const handleRowClick = () => {
    if (onItemClick) {
      onItemClick(item);
    }
  };

  return (
    <>
      {/* Main Row */}
      <div 
        className="flex group cursor-pointer hover:bg-muted/30 transition-colors"
        onClick={handleRowClick}
      >
        {/* Left Panel - Fixed width */}
        <div className="w-80 flex-shrink-0">
          <GanttLeftPanel
            item={item}
            isExpanded={isExpanded}
            onToggleExpand={onToggleExpand}
            onAddChild={onAddChild}
          />
        </div>

        {/* Timeline Bar - Flexible width */}
        <div className="flex-1 min-w-0">
          <GanttTimelineBar
            item={item}
            timelineStart={timelineStart}
            timelineEnd={timelineEnd}
            timelineWidth={timelineWidth}
          />
        </div>
      </div>

      {/* Children Rows */}
      {hasChildren && isExpanded && item.children && (
        <>
          {item.children.map((child) => (
            <GanttRow
              key={child.id}
              item={child}
              timelineStart={timelineStart}
              timelineEnd={timelineEnd}
              timelineWidth={timelineWidth}
              expandedItems={expandedItems}
              onToggleExpand={onToggleExpand}
              onItemClick={onItemClick}
              onAddChild={onAddChild}
            />
          ))}
        </>
      )}
    </>
  );
}