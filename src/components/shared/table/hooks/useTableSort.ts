import { useState, useCallback, useMemo } from "react";
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

  const getSortedData = useCallback(
    (data: T[]): T[] => {
      return sortData(data, sortKey, sortDirection, columns);
    },
    [sortKey, sortDirection, columns]
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
