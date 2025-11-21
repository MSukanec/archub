/**
 * Material Mapper
 * 
 * Transformaciones y utilidades para datos de materiales.
 */

import type { Material, MaterialCategory } from '../types';

/**
 * Convierte categorías planas a estructura jerárquica para CascadingSelect
 */
export function convertToCascadingOptions(categories: MaterialCategory[]): any[] {
  return categories.map(category => ({
    value: category.id,
    label: category.name,
    children: category.children && category.children.length > 0
      ? convertToCascadingOptions(category.children)
      : undefined,
  }));
}

/**
 * Encuentra el path completo de una categoría por su ID
 */
export function findCategoryPath(
  categories: MaterialCategory[],
  targetId: string
): string[] {
  function search(cats: MaterialCategory[], path: string[] = []): string[] | null {
    for (const cat of cats) {
      const currentPath = [...path, cat.id];

      if (cat.id === targetId) {
        return currentPath;
      }

      if (cat.children && cat.children.length > 0) {
        const result = search(cat.children, currentPath);
        if (result) return result;
      }
    }
    return null;
  }

  return search(categories) || [];
}

/**
 * Encuentra el ID de una categoría por su nombre
 */
export function findCategoryIdByName(
  categories: MaterialCategory[],
  targetName: string
): string | null {
  function search(cats: MaterialCategory[]): string | null {
    for (const cat of cats) {
      if (cat.name === targetName) {
        return cat.id;
      }

      if (cat.children && cat.children.length > 0) {
        const result = search(cat.children);
        if (result) return result;
      }
    }
    return null;
  }

  return search(categories);
}

/**
 * Aplana categorías jerárquicas para select simple
 */
export function flattenCategories(
  categories: MaterialCategory[],
  level = 0
): Array<{ id: string; name: string; level: number }> {
  const result: Array<{ id: string; name: string; level: number }> = [];

  categories.forEach(category => {
    result.push({
      id: category.id,
      name: category.name,
      level,
    });

    if (category.children && category.children.length > 0) {
      result.push(...flattenCategories(category.children, level + 1));
    }
  });

  return result;
}

/**
 * Formatea el precio de un material con su moneda
 */
export function formatMaterialPrice(material: Material): string {
  if (!material.organization_material_prices || material.organization_material_prices.length === 0) {
    return 'Sin precio';
  }

  const price = material.organization_material_prices[0];
  return `${price.currency.symbol} ${price.unit_price.toFixed(2)}`;
}

/**
 * Obtiene el rango de precios de un material
 */
export function getPriceRange(material: Material): { min?: number; max?: number; avg?: number } {
  return {
    min: material.min_price,
    max: material.max_price,
    avg: material.avg_price,
  };
}
