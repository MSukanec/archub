import { useState, useCallback, useRef } from "react";
import { SortDirection, SortType, Column, DefaultSort } from "../types";
import { sortData } from "../utils";

interface UseTableSortOptions<T> {
  columns: Column<T>[];
  defaultSort?: DefaultSort;
}

interface UseTableSortReturn<T> {
  sortKey: string | null;
  sortDirection: SortDirection;
  handleSort: (key: string, sortType?: SortType) => void;
  getSortedData: (data: T[]) => T[];
  resetSort: () => void;
}

export function useTableSort<T>({
  columns,
  defaultSort,
}: UseTableSortOptions<T>): UseTableSortReturn<T> {
  const [sortKey, setSortKey] = useState<string | null>(
    defaultSort?.key || null
  );
  const [sortDirection, setSortDirection] = useState<SortDirection>(
    defaultSort?.direction || null
  );
  
  // Use ref for columns to avoid recreating getSortedData on column reference changes
  // Columns are structurally stable (same keys/config) even if reference changes
  const columnsRef = useRef(columns);
  columnsRef.current = columns;

  const handleSort = useCallback(
    (key: string, _sortType?: SortType) => {
      if (sortKey === key) {
        setSortDirection((prev) => {
          if (prev === "asc") return "desc";
          if (prev === "desc") return null;
          return "asc";
        });

        if (sortDirection === "desc") {
          setSortKey(null);
        }
      } else {
        setSortKey(key);
        setSortDirection("asc");
      }
    },
    [sortKey, sortDirection]
  );

  // ENTERPRISE FIX: getSortedData now only depends on sortKey and sortDirection (primitives)
  // This breaks the render feedback loop caused by columns reference changing
  const getSortedData = useCallback(
    (data: T[]): T[] => {
      return sortData(data, sortKey, sortDirection, columnsRef.current);
    },
    [sortKey, sortDirection]
  );

  const resetSort = useCallback(() => {
    setSortKey(defaultSort?.key || null);
    setSortDirection(defaultSort?.direction || null);
  }, [defaultSort]);

  return {
    sortKey,
    sortDirection,
    handleSort,
    getSortedData,
    resetSort,
  };
}
