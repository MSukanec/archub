import { useState, useCallback, useMemo } from "react";
import { DEFAULT_ITEMS_PER_PAGE } from "../constants";
import { paginateData } from "../utils";

interface UseTablePaginationOptions {
  itemsPerPage?: number;
  totalItems: number;
}

interface UseTablePaginationReturn<T> {
  currentPage: number;
  totalPages: number;
  itemsPerPage: number;
  showPagination: boolean;
  setCurrentPage: (page: number) => void;
  goToNextPage: () => void;
  goToPreviousPage: () => void;
  goToFirstPage: () => void;
  goToLastPage: () => void;
  getPaginatedData: (data: T[]) => T[];
  resetPagination: () => void;
}

export function useTablePagination<T>({
  itemsPerPage = DEFAULT_ITEMS_PER_PAGE,
  totalItems,
}: UseTablePaginationOptions): UseTablePaginationReturn<T> {
  const [currentPage, setCurrentPage] = useState(1);

  const totalPages = useMemo(
    () => Math.ceil(totalItems / itemsPerPage),
    [totalItems, itemsPerPage]
  );

  const showPagination = useMemo(
    () => totalItems > itemsPerPage,
    [totalItems, itemsPerPage]
  );

  const goToNextPage = useCallback(() => {
    setCurrentPage((prev) => Math.min(prev + 1, totalPages));
  }, [totalPages]);

  const goToPreviousPage = useCallback(() => {
    setCurrentPage((prev) => Math.max(prev - 1, 1));
  }, []);

  const goToFirstPage = useCallback(() => {
    setCurrentPage(1);
  }, []);

  const goToLastPage = useCallback(() => {
    setCurrentPage(totalPages);
  }, [totalPages]);

  const getPaginatedData = useCallback(
    (data: T[]): T[] => {
      if (!showPagination) return data;
      return paginateData(data, currentPage, itemsPerPage);
    },
    [currentPage, itemsPerPage, showPagination]
  );

  const resetPagination = useCallback(() => {
    setCurrentPage(1);
  }, []);

  return {
    currentPage,
    totalPages,
    itemsPerPage,
    showPagination,
    setCurrentPage,
    goToNextPage,
    goToPreviousPage,
    goToFirstPage,
    goToLastPage,
    getPaginatedData,
    resetPagination,
  };
}
