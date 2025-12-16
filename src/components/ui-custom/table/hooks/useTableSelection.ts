import { useState, useCallback, useMemo, useEffect } from "react";

interface UseTableSelectionOptions<T> {
  externalSelectedItems?: T[];
  onSelectionChange?: (items: T[]) => void;
  getItemId: (item: T) => string | number;
  pageData: T[];
}

interface UseTableSelectionReturn<T> {
  selectedItems: T[];
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
  externalSelectedItems,
  onSelectionChange,
  getItemId,
  pageData,
}: UseTableSelectionOptions<T>): UseTableSelectionReturn<T> {
  const [internalSelectedItems, setInternalSelectedItems] = useState<T[]>(
    () => externalSelectedItems ?? []
  );

  const isControlled = onSelectionChange !== undefined;
  const selectedItems = isControlled
    ? (externalSelectedItems ?? [])
    : internalSelectedItems;

  useEffect(() => {
    if (!isControlled && externalSelectedItems) {
      setInternalSelectedItems(externalSelectedItems);
    }
  }, [isControlled, externalSelectedItems]);

  const updateSelection = useCallback(
    (newItems: T[]) => {
      if (isControlled) {
        onSelectionChange?.(newItems);
      } else {
        setInternalSelectedItems(newItems);
      }
    },
    [isControlled, onSelectionChange]
  );

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
      if (checked) {
        updateSelection([...selectedItems, item]);
      } else {
        updateSelection(
          selectedItems.filter(
            (selectedItem) => getItemId(selectedItem) !== getItemId(item)
          )
        );
      }
    },
    [selectedItems, updateSelection, getItemId]
  );

  const handleSelectAll = useCallback(
    (checked: boolean) => {
      if (checked) {
        const newSelectedItems = [...selectedItems];
        pageData.forEach((item) => {
          if (!isItemSelected(item)) {
            newSelectedItems.push(item);
          }
        });
        updateSelection(newSelectedItems);
      } else {
        const currentPageIds = new Set(pageData.map((item) => getItemId(item)));
        const filteredSelection = selectedItems.filter(
          (item) => !currentPageIds.has(getItemId(item))
        );
        updateSelection(filteredSelection);
      }
    },
    [selectedItems, updateSelection, pageData, getItemId, isItemSelected]
  );

  const clearSelection = useCallback(() => {
    updateSelection([]);
  }, [updateSelection]);

  const selectAll = useCallback(
    (allData: T[]) => {
      updateSelection(allData);
    },
    [updateSelection]
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
    selectedItems,
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
