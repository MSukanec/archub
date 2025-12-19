import { useState, useCallback, useMemo, useRef } from "react";
import { Column } from "../types";
import { filterData } from "../utils";

interface UseTableFilterOptions<T> {
  columns: Column<T>[];
  externalSearchValue?: string;
  onExternalSearchChange?: (value: string) => void;
}

interface UseTableFilterReturn<T> {
  searchValue: string;
  filters: Record<string, any>;
  setSearchValue: (value: string) => void;
  setFilters: (filters: Record<string, any>) => void;
  updateFilter: (key: string, value: any) => void;
  clearFilters: () => void;
  getFilteredData: (data: T[]) => T[];
  isFilterActive: boolean;
}

export function useTableFilter<T>({
  columns,
  externalSearchValue,
  onExternalSearchChange,
}: UseTableFilterOptions<T>): UseTableFilterReturn<T> {
  const [internalSearchValue, setInternalSearchValue] = useState("");
  const [filters, setFilters] = useState<Record<string, any>>({});
  
  // Use ref for columns to avoid recreating getFilteredData on column reference changes
  // Columns are structurally stable (same keys/config) even if reference changes
  const columnsRef = useRef(columns);
  columnsRef.current = columns;

  const searchValue = externalSearchValue ?? internalSearchValue;

  const setSearchValue = useCallback(
    (value: string) => {
      if (onExternalSearchChange) {
        onExternalSearchChange(value);
      } else {
        setInternalSearchValue(value);
      }
    },
    [onExternalSearchChange]
  );

  const updateFilter = useCallback((key: string, value: any) => {
    setFilters((prev) => ({
      ...prev,
      [key]: value,
    }));
  }, []);

  const clearFilters = useCallback(() => {
    setSearchValue("");
    setFilters({});
  }, [setSearchValue]);

  // ENTERPRISE FIX: getFilteredData now only depends on searchValue (primitive)
  // This breaks the render feedback loop caused by columns reference changing
  const getFilteredData = useCallback(
    (data: T[]): T[] => {
      return filterData(data, searchValue, columnsRef.current);
    },
    [searchValue]
  );

  const isFilterActive = useMemo(() => {
    return searchValue.length > 0 || Object.keys(filters).length > 0;
  }, [searchValue, filters]);

  return {
    searchValue,
    filters,
    setSearchValue,
    setFilters,
    updateFilter,
    clearFilters,
    getFilteredData,
    isFilterActive,
  };
}
