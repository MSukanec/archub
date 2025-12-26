import { ReactNode } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  ChevronUp,
  ChevronDown,
  ArrowUpDown,
  Search,
  Filter,
  X,
  Download,
  Group,
  FileText,
  Upload,
  Trash2,
  CheckSquare,
} from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { Tabs } from "@/components/shared/Tabs";
import { TopBarConfig, GroupingOption } from "./types";
import { TABLE_LABELS, TABLE_ANIMATION, TABLE_BULK_ANIMATION } from "./constants";
interface TableTopBarProps {
  topBar?: TopBarConfig;
  selectable: boolean;
  selectedCount: number;
  onClearSelection: () => void;
  searchInputValue: string;
  onSearchChange: (value: string) => void;
  isFilterActive: boolean;
  onClearFilters: () => void;
}
export function TableTopBar({
  topBar,
  selectable,
  selectedCount,
  onClearSelection,
  searchInputValue,
  onSearchChange,
  isFilterActive,
  onClearFilters,
}: TableTopBarProps) {
  const tabs = topBar?.tabs || [];
  const showSearch = topBar?.showSearch ?? true;
  const showFilter = topBar?.showFilter ?? true;
  const showSort = topBar?.showSort ?? false;
  const showClearFilters = topBar?.showClearFilters ?? true;
  const hasBulkSelection = selectable && selectedCount > 0;
  const createPopoverButton = (
    option: { value: string; label: string },
    currentValue: string,
    onClick: (value: string) => void
  ) => {
    const isActive = currentValue === option.value;
    return (
      <Button
        key={option.value}
        variant={isActive ? "secondary" : "ghost"}
        size="sm"
        onClick={() => onClick(option.value)}
        className={cn(
          "w-full justify-start text-xs font-normal h-8",
          isActive ? "button-secondary-pressed hover:bg-secondary" : ""
        )}
      >
        {option.label}
      </Button>
    );
  };
  const createStandardPopover = (
    title: string,
    options: GroupingOption[],
    currentValue: string,
    onChange: (value: string) => void
  ) => {
    return (
      <>
        <div className="text-xs font-medium mb-2 block">{title}</div>
        <div className="space-y-1">
          {options.map((option) =>
            createPopoverButton(option, currentValue, onChange)
          )}
        </div>
      </>
    );
  };
  const defaultGroupingContent = () => {
    const groupingOptions = topBar?.groupingOptions || [
      { value: "none", label: TABLE_LABELS.grouping.none },
    ];
    const currentValue = topBar?.currentGrouping || "none";
    const onChange = topBar?.onGroupingChange || (() => {});
    return createStandardPopover(
      TABLE_LABELS.grouping.title,
      groupingOptions,
      currentValue,
      onChange
    );
  };
  const defaultExportContent = () => {
    const exportOptions = [
      {
        key: "excel",
        label: TABLE_LABELS.export.excel,
        icon: Download,
        onClick: topBar?.onExport,
      },
      {
        key: "pdf",
        label: TABLE_LABELS.export.pdf,
        icon: FileText,
        onClick: topBar?.onExportPDF,
      },
    ];
    return (
      <>
        <div className="text-xs font-medium mb-2 block">
          {TABLE_LABELS.export.title}
        </div>
        <div className="space-y-1">
          {exportOptions.map((option) => {
            const IconComponent = option.icon;
            return (
              <Button
                key={option.key}
                variant="ghost"
                size="sm"
                onClick={option.onClick}
                disabled={topBar?.isExporting ?? false}
                className="w-full justify-start text-xs font-normal h-8 gap-2"
              >
                <IconComponent className="h-3 w-3" />
                {option.label}
              </Button>
            );
          })}
        </div>
      </>
    );
  };
  return (
    <div className="hidden lg:block border-b border-[var(--card-border)] bg-[var(--card-bg)] relative overflow-hidden">
      <AnimatePresence mode="wait">
        {hasBulkSelection ? (
          <motion.div
            key="bulk-mode"
            initial={TABLE_BULK_ANIMATION.initial}
            animate={TABLE_BULK_ANIMATION.animate}
            exit={TABLE_BULK_ANIMATION.exit}
            transition={TABLE_BULK_ANIMATION.transition}
            className="flex items-center justify-between px-4 py-3"
          >
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2">
                <CheckSquare className="h-4 w-4 text-primary" />
                <span className="text-sm font-medium">
                  {selectedCount}{" "}
                  {selectedCount === 1
                    ? TABLE_LABELS.selection.selected
                    : TABLE_LABELS.selection.selectedPlural}
                </span>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={onClearSelection}
                className="h-8 px-3 text-xs gap-1.5"
              >
                <X className="h-3.5 w-3.5" />
                {TABLE_LABELS.selection.deselect}
              </Button>
            </div>
            <div className="flex items-center gap-1">
              {topBar?.bulkActions?.customActions}
              {topBar?.bulkActions?.onExport && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={topBar.bulkActions.onExport}
                  className="gap-2"
                >
                  <Download className="h-4 w-4" />
                  <span className="text-xs">{TABLE_LABELS.export.button}</span>
                </Button>
              )}
              {topBar?.bulkActions?.onDelete && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={topBar.bulkActions.onDelete}
                  className="gap-2 text-destructive hover:text-destructive hover:bg-destructive/10"
                >
                  <Trash2 className="h-4 w-4" />
                  <span className="text-xs">Eliminar</span>
                </Button>
              )}
            </div>
          </motion.div>
        ) : (
          <motion.div
            key="normal-mode"
            initial={TABLE_ANIMATION.initial}
            animate={TABLE_ANIMATION.animate}
            exit={TABLE_ANIMATION.exit}
            transition={TABLE_ANIMATION.transition}
            className="flex items-center justify-between px-4 py-3"
          >
            <div className="flex items-center gap-3">
              {topBar?.tabsConfig && (
                <Tabs
                  tabs={topBar.tabsConfig.tabs}
                  value={topBar.tabsConfig.value}
                  onValueChange={topBar.tabsConfig.onValueChange}
                />
              )}
              {!topBar?.tabsConfig && topBar?.leftModeButtons && (
                <div className="flex items-center gap-1">
                  {topBar.leftModeButtons.options.map((option) => (
                    <Button
                      key={option.key}
                      variant="ghost"
                      size="sm"
                      onClick={() =>
                        topBar.leftModeButtons?.onModeChange?.(option.key)
                      }
                      className={cn(
                        "text-xs h-8 px-3",
                        topBar.leftModeButtons?.activeMode === option.key
                          ? "button-secondary-pressed hover:bg-secondary"
                          : ""
                      )}
                    >
                      {option.label}
                    </Button>
                  ))}
                </div>
              )}
              {!topBar?.tabsConfig && tabs.length > 0 && (
                <div className="flex items-center gap-1">
                  {tabs.map((tab) => (
                    <Button
                      key={tab}
                      variant={topBar?.activeTab === tab ? "secondary" : "ghost"}
                      size="sm"
                      onClick={() => topBar?.onTabChange?.(tab)}
                      className={cn(
                        "h-8 px-3 text-xs font-normal",
                        topBar?.activeTab === tab
                          ? "button-secondary-pressed hover:bg-secondary"
                          : ""
                      )}
                    >
                      {tab}
                    </Button>
                  ))}
                </div>
              )}
            </div>
            <div className="flex items-center gap-1">
              {showSearch && (
                <div
                  className={cn(
                    "inline-flex items-center justify-start whitespace-nowrap rounded-lg text-xs",
                    "bg-transparent text-[var(--button-ghost-text)] hover:bg-transparent hover:text-[var(--button-ghost-hover-text)] border border-[var(--button-ghost-border)] hover:border-[var(--button-ghost-hover-border)]",
                    "h-8 px-2 py-2 gap-1.5 w-96",
                    "focus-within:ring-0 focus-within:outline-none"
                  )}
                >
                  <Input
                    placeholder={TABLE_LABELS.search.placeholder}
                    value={searchInputValue}
                    onChange={(e) => onSearchChange(e.target.value)}
                    className="flex-1 h-full text-xs border-0 bg-transparent placeholder:text-[var(--muted-foreground)] focus:ring-0 focus:outline-none focus-visible:ring-0 focus-visible:outline-none p-0"
                  />
                  {searchInputValue && (
                    <Button
                      variant="ghost"
                      size="icon-sm"
                      onClick={() => onSearchChange("")}
                      className="h-4 w-4 p-0 hover:bg-transparent focus:ring-0 focus:outline-none focus-visible:ring-0"
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  )}
                  <Search className="h-4 w-4 text-[var(--muted-foreground)] shrink-0" />
                </div>
              )}
              {showSort && topBar?.renderSortContent && (
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="ghost"
                      size="sm"
                      className={cn(
                        "gap-2",
                        topBar?.isSortActive ? "button-secondary-pressed" : ""
                      )}
                    >
                      <ArrowUpDown className="h-4 w-4" />
                      <span className="text-xs">{TABLE_LABELS.sort.button}</span>
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-56" align="center">
                    {topBar.renderSortContent()}
                  </PopoverContent>
                </Popover>
              )}
              {showFilter && topBar?.renderFilterContent && (
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="ghost"
                      size="sm"
                      className={cn(
                        "gap-2",
                        isFilterActive ? "button-secondary-pressed" : ""
                      )}
                    >
                      <Filter className="h-4 w-4" />
                      <span className="text-xs">{TABLE_LABELS.filter.button}</span>
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-64 p-4" align="center">
                    <div className="space-y-4">
                      {isFilterActive && (
                        <Button
                          variant="default"
                          size="sm"
                          onClick={onClearFilters}
                          className="w-full gap-2"
                        >
                          <X className="h-4 w-4" />
                          <span className="text-xs">
                            {TABLE_LABELS.filter.clear}
                          </span>
                        </Button>
                      )}
                      {topBar.renderFilterContent()}
                    </div>
                  </PopoverContent>
                </Popover>
              )}
              {topBar?.groupingOptions && topBar.groupingOptions.length > 0 && (
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="ghost"
                      size="sm"
                      className={cn(
                        "gap-2",
                        topBar?.isGroupingActive ? "button-secondary-pressed" : ""
                      )}
                    >
                      <Group className="h-4 w-4" />
                      <span className="text-xs">
                        {TABLE_LABELS.grouping.button}
                      </span>
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-64 p-4" align="center">
                    {(topBar?.renderGroupingContent ?? defaultGroupingContent)()}
                  </PopoverContent>
                </Popover>
              )}
              {topBar?.showImport && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={topBar.onImport}
                  disabled={topBar.isImporting}
                  className="gap-2"
                >
                  <Upload className="h-4 w-4" />
                  <span className="text-xs">{TABLE_LABELS.import.button}</span>
                </Button>
              )}
              {topBar?.showExport && (
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="ghost" size="sm" className="gap-2">
                      <Download className="h-4 w-4" />
                      <span className="text-xs">{TABLE_LABELS.export.button}</span>
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-64 p-4" align="end">
                    {(topBar?.renderExportContent ?? defaultExportContent)()}
                  </PopoverContent>
                </Popover>
              )}
              {topBar?.customActions}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
