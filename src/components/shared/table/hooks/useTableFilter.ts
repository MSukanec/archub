import { useState, useCallback, useMemo } from "react";
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

  const getFilteredData = useCallback(
    (data: T[]): T[] => {
      return filterData(data, searchValue, columns);
    },
    [searchValue, columns]
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
