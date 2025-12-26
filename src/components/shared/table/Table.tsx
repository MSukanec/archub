import { useState, useMemo } from "react";
import { cn } from "@/lib/utils";
import { useProjectReadOnlyContext } from "@/contexts/ProjectReadOnlyContext";
import { TableDesktop } from "./TableDesktop";
import { TableMobile } from "./TableMobile";
import { TableLoadingSkeleton } from "./TableLoadingSkeleton";
import { useTableSort } from "./hooks/useTableSort";
import { useTableFilter } from "./hooks/useTableFilter";
import { useTablePagination } from "./hooks/useTablePagination";
import { useTableSelection } from "./hooks/useTableSelection";
import { TableProps } from "./types";
import {
  getGridTemplateColumns,
  separateActiveInactive,
  sortData,
  groupData,
} from "./utils";
import { DEFAULT_ITEMS_PER_PAGE } from "./constants";
const EMPTY_ARRAY: any[] = [];
export function Table<T = any>({
  columns,
  data,
  emptyState,
  emptyStateConfig,
  isLoading = false,
  className,
  selectable = false,
  selectedItems: externalSelectedItems = EMPTY_ARRAY,
  onSelectionChange,
  getItemId = (item: T) => (item as any).id,
  getRowClassName,
  onCardClick,
  onRowClick,
  defaultSort,
  renderCard,
  cardSpacing = "space-y-2",
  renderFooterRow,
  groupBy,
  renderGroupHeader,
  mode = "default",
  topBar,
  headerActions,
  showDoubleHeader = false,
  rowActions,
  primaryRowAction,
  leadingRowAction,
  getIsInactive,
  inactiveSeparatorLabel = "Completados",
  showInactiveSeparator = true,
  hideActions: hideActionsProp,
}: TableProps<T>) {
  const { shouldHideActions } = useProjectReadOnlyContext();
  const hideActions = hideActionsProp ?? shouldHideActions;
  const [searchInputValue, setSearchInputValue] = useState("");
  const { sortKey, sortDirection, handleSort, getSortedData } = useTableSort({
    columns,
    defaultSort,
  });
  const {
    searchValue,
    setSearchValue,
    getFilteredData,
    isFilterActive,
    clearFilters,
  } = useTableFilter({
    columns,
    externalSearchValue: topBar?.searchValue,
    onExternalSearchChange: topBar?.onSearchChange,
  });
  const filteredData = useMemo(() => {
    return getFilteredData(data);
  }, [data, getFilteredData]);
  const processedData = useMemo(() => {
    if (getIsInactive) {
      const { active, inactive } = separateActiveInactive(
        filteredData,
        getIsInactive
      );
      const sortedActive = getSortedData(active);
      const sortedInactive = getSortedData(inactive);
      return [...sortedActive, ...sortedInactive];
    }
    return getSortedData(filteredData);
  }, [filteredData, getSortedData, getIsInactive]);
  const groupedData = useMemo(() => {
    return groupData(processedData, groupBy);
  }, [processedData, groupBy]);
  const flattenedData = useMemo(() => {
    return Object.values(groupedData).flat();
  }, [groupedData]);
  const {
    currentPage,
    totalPages,
    showPagination,
    getPaginatedData,
    goToNextPage,
    goToPreviousPage,
    setCurrentPage,
  } = useTablePagination<T>({
    itemsPerPage: DEFAULT_ITEMS_PER_PAGE,
    totalItems: flattenedData.length,
  });
  const paginatedData = useMemo(() => {
    return getPaginatedData(flattenedData);
  }, [flattenedData, getPaginatedData]);
  const {
    selectedItems,
    isItemSelected,
    handleSelectItem,
    handleSelectAll,
    clearSelection,
    selectedCount,
  } = useTableSelection({
    externalSelectedItems,
    onSelectionChange,
    getItemId,
    pageData: paginatedData,
  });
  const hasActions = !!rowActions;
  const gridTemplateColumns = getGridTemplateColumns(
    columns,
    selectable,
    hasActions
  );
  const handleSearchChange = (value: string) => {
    setSearchInputValue(value);
    if (topBar?.onSearchChange) {
      topBar.onSearchChange(value);
    } else {
      setSearchValue(value);
    }
  };
  const handleClearFilters = () => {
    if (topBar?.onClearFilters) {
      topBar.onClearFilters();
    } else {
      clearFilters();
      setSearchInputValue("");
    }
  };
  const combinedIsFilterActive =
    topBar?.isFilterActive ?? (isFilterActive || searchInputValue.length > 0);
  const hasOriginalData = data.length > 0;
  const hasFilteredData = filteredData.length > 0;
  const hasActiveSearch = searchValue.length > 0 || searchInputValue.length > 0;
  if (isLoading) {
    return (
      <TableLoadingSkeleton
        columns={columns}
        selectable={selectable}
        hasActions={hasActions}
        className={className}
      />
    );
  }
  return (
    <div className={cn("space-y-3 border-2 border-[var(--accent)] rounded-lg p-2", className)}>
      <TableDesktop
        columns={columns}
        data={data}
        paginatedData={paginatedData}
        groupedData={groupedData}
        hasOriginalData={hasOriginalData}
        hasFilteredData={hasFilteredData}
        hasActiveSearch={hasActiveSearch}
        searchValue={searchValue || searchInputValue}
        gridTemplateColumns={gridTemplateColumns}
        sortKey={sortKey}
        sortDirection={sortDirection}
        onSort={handleSort}
        selectable={selectable}
        selectedItems={selectedItems}
        isItemSelected={isItemSelected}
        onSelectItem={handleSelectItem}
        onSelectAll={handleSelectAll}
        onClearSelection={clearSelection}
        selectedCount={selectedCount}
        getItemId={getItemId}
        onRowClick={onRowClick}
        rowActions={rowActions}
        primaryRowAction={primaryRowAction}
        leadingRowAction={leadingRowAction}
        hideActions={hideActions}
        getRowClassName={getRowClassName}
        groupBy={groupBy}
        renderGroupHeader={renderGroupHeader}
        mode={mode}
        topBar={topBar}
        searchInputValue={searchInputValue}
        onSearchChange={handleSearchChange}
        isFilterActive={combinedIsFilterActive}
        onClearFilters={handleClearFilters}
        headerActions={headerActions}
        showDoubleHeader={showDoubleHeader}
        emptyState={emptyState}
        emptyStateConfig={emptyStateConfig}
        renderFooterRow={renderFooterRow}
        getIsInactive={getIsInactive}
        inactiveSeparatorLabel={inactiveSeparatorLabel}
        showInactiveSeparator={showInactiveSeparator}
        showPagination={showPagination}
        currentPage={currentPage}
        totalPages={totalPages}
        onPageChange={setCurrentPage}
        onNextPage={goToNextPage}
        onPrevPage={goToPreviousPage}
      />
      <TableMobile
        columns={columns}
        data={data}
        paginatedData={paginatedData}
        hasOriginalData={hasOriginalData}
        hasFilteredData={hasFilteredData}
        hasActiveSearch={hasActiveSearch}
        searchValue={searchValue || searchInputValue}
        selectable={selectable}
        isItemSelected={isItemSelected}
        onSelectItem={handleSelectItem}
        getItemId={getItemId}
        onCardClick={onCardClick}
        renderCard={renderCard}
        cardSpacing={cardSpacing}
        emptyState={emptyState}
        emptyStateConfig={emptyStateConfig}
        getRowClassName={getRowClassName}
        getIsInactive={getIsInactive}
        showPagination={showPagination}
        currentPage={currentPage}
        totalPages={totalPages}
        onNextPage={goToNextPage}
        onPrevPage={goToPreviousPage}
      />
    </div>
  );
}
export type { TableProps } from "./types";
export type {
  Column,
  RowAction,
  EmptyStateConfig,
  TopBarConfig,
} from "./types";
