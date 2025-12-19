import { Column, SortDirection, SortType } from "./types";
import { buildGridTemplateColumns, getColumnWidth, TableColumnType } from "./tableColumnTypes";

export function sortData<T>(
  data: T[],
  sortKey: string | null,
  sortDirection: SortDirection,
  columns: Column<T>[]
): T[] {
  if (!sortKey || !sortDirection) return data;

  return [...data].sort((a, b) => {
    const column = columns.find((col) => col.key === sortKey);
    const sortType: SortType = column?.sortType || "string";

    const aValue = a[sortKey as keyof T];
    const bValue = b[sortKey as keyof T];

    if (aValue == null && bValue == null) return 0;
    if (aValue == null) return sortDirection === "asc" ? -1 : 1;
    if (bValue == null) return sortDirection === "asc" ? 1 : -1;

    let comparison = 0;

    switch (sortType) {
      case "number":
        comparison = (Number(aValue) || 0) - (Number(bValue) || 0);
        break;
      case "date":
        const dateA = new Date(String(aValue));
        const dateB = new Date(String(bValue));
        comparison = dateA.getTime() - dateB.getTime();
        break;
      case "string":
      default:
        comparison = String(aValue).localeCompare(String(bValue));
        break;
    }

    return sortDirection === "asc" ? comparison : -comparison;
  });
}

export function filterData<T>(
  data: T[],
  searchValue: string,
  columns: Column<T>[]
): T[] {
  if (!searchValue) return data;

  const lowerSearch = searchValue.toLowerCase();

  return data.filter((item) => {
    return columns.some((column) => {
      const value = item[column.key as keyof T];
      if (value == null) return false;
      return String(value).toLowerCase().includes(lowerSearch);
    });
  });
}

export function groupData<T>(
  data: T[],
  groupBy: keyof T | string | undefined
): Record<string, T[]> {
  if (!groupBy) {
    return { all: data };
  }

  return data.reduce(
    (acc, item) => {
      const groupKey = String(item[groupBy as keyof T] || "Sin grupo");
      if (!acc[groupKey]) {
        acc[groupKey] = [];
      }
      acc[groupKey].push(item);
      return acc;
    },
    {} as Record<string, T[]>
  );
}

export function paginateData<T>(
  data: T[],
  currentPage: number,
  itemsPerPage: number
): T[] {
  const startIndex = (currentPage - 1) * itemsPerPage;
  return data.slice(startIndex, startIndex + itemsPerPage);
}

export function separateActiveInactive<T>(
  data: T[],
  getIsInactive?: (item: T) => boolean
): { active: T[]; inactive: T[] } {
  if (!getIsInactive) {
    return { active: data, inactive: [] };
  }

  const active: T[] = [];
  const inactive: T[] = [];

  data.forEach((item) => {
    if (getIsInactive(item)) {
      inactive.push(item);
    } else {
      active.push(item);
    }
  });

  return { active, inactive };
}

export function getGridTemplateColumns<T>(
  columns: Column<T>[],
  selectable: boolean,
  hasActions: boolean
): string {
  const hasSemanticTypes = columns.some(col => col.type);
  
  if (hasSemanticTypes) {
    const columnTypes = columns.map(col => col.type);
    return buildGridTemplateColumns(columnTypes, { selectable, hasActions });
  }
  
  const widths = columns.map((col) => col.width || "minmax(0, 1fr)");
  const allSameWidth = widths.every((w) => w === widths[0]);

  let baseColumns: string;
  if (allSameWidth && widths[0] !== "minmax(0, 1fr)") {
    baseColumns = `repeat(${columns.length}, minmax(0, 1fr))`;
  } else {
    baseColumns = widths.join(" ");
  }

  return [selectable ? "40px" : "", baseColumns, hasActions ? "40px" : ""]
    .filter(Boolean)
    .join(" ");
}

export function getColumnAlignment(
  column: Column<any>
): "left" | "center" | "right" {
  if (column.align) return column.align;
  return column.sortType === "number" ? "right" : "left";
}

export function getJustifyClass(
  alignment: "left" | "center" | "right"
): string {
  switch (alignment) {
    case "right":
      return "justify-end";
    case "center":
      return "justify-center";
    default:
      return "justify-start";
  }
}
