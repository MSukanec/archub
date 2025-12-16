import { useCallback, useMemo } from "react";

interface UseTableSelectionOptions<T> {
  selectedItems: T[];
  onSelectionChange?: (items: T[]) => void;
  getItemId: (item: T) => string | number;
  pageData: T[];
}

interface UseTableSelectionReturn<T> {
  isItemSelected: (item: T) => boolean;
  handleSelectItem: (item: T, checked: boolean) => void;
  handleSelectAll: (checked: boolean) => void;
  clearSelection: () => void;
  selectAll: (allData: T[]) => void;
  isAllPageSelected: boolean;
  isPartiallySelected: boolean;
  selectedCount: number;
}

export function useTableSelection<T>({
  selectedItems,
  onSelectionChange,
  getItemId,
  pageData,
}: UseTableSelectionOptions<T>): UseTableSelectionReturn<T> {
  const isItemSelected = useCallback(
    (item: T): boolean => {
      return selectedItems.some(
        (selectedItem) => getItemId(selectedItem) === getItemId(item)
      );
    },
    [selectedItems, getItemId]
  );

  const handleSelectItem = useCallback(
    (item: T, checked: boolean) => {
      if (!onSelectionChange) return;

      if (checked) {
        onSelectionChange([...selectedItems, item]);
      } else {
        onSelectionChange(
          selectedItems.filter(
            (selectedItem) => getItemId(selectedItem) !== getItemId(item)
          )
        );
      }
    },
    [selectedItems, onSelectionChange, getItemId]
  );

  const handleSelectAll = useCallback(
    (checked: boolean) => {
      if (!onSelectionChange) return;

      if (checked) {
        const newSelectedItems = [...selectedItems];
        pageData.forEach((item) => {
          if (!isItemSelected(item)) {
            newSelectedItems.push(item);
          }
        });
        onSelectionChange(newSelectedItems);
      } else {
        const currentPageIds = new Set(pageData.map((item) => getItemId(item)));
        const filteredSelection = selectedItems.filter(
          (item) => !currentPageIds.has(getItemId(item))
        );
        onSelectionChange(filteredSelection);
      }
    },
    [selectedItems, onSelectionChange, pageData, getItemId, isItemSelected]
  );

  const clearSelection = useCallback(() => {
    onSelectionChange?.([]);
  }, [onSelectionChange]);

  const selectAll = useCallback(
    (allData: T[]) => {
      onSelectionChange?.(allData);
    },
    [onSelectionChange]
  );

  const isAllPageSelected = useMemo(() => {
    return pageData.length > 0 && pageData.every((item) => isItemSelected(item));
  }, [pageData, isItemSelected]);

  const isPartiallySelected = useMemo(() => {
    const selectedCount = pageData.filter((item) => isItemSelected(item)).length;
    return selectedCount > 0 && selectedCount < pageData.length;
  }, [pageData, isItemSelected]);

  const selectedCount = selectedItems.length;

  return {
    isItemSelected,
    handleSelectItem,
    handleSelectAll,
    clearSelection,
    selectAll,
    isAllPageSelected,
    isPartiallySelected,
    selectedCount,
  };
}
