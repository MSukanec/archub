import React, { ReactNode } from 'react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Tag, FolderTree, Star, Coins, Wallet, Upload, Plus } from 'lucide-react';

interface ActionBarDesktopRowProps {
  // Filtros de la izquierda (copiados exactamente de la tabla)
  filterByType: string;
  setFilterByType: (value: string) => void;
  availableTypes: (string | null)[];
  filterByCategory: string;
  setFilterByCategory: (value: string) => void;
  availableCategories: (string | null)[];
  filterByFavorites: string;
  setFilterByFavorites: (value: string) => void;
  filterByCurrency: string;
  setFilterByCurrency: (value: string) => void;
  availableCurrencies: string[];
  filterByWallet: string;
  setFilterByWallet: (value: string) => void;
  availableWallets: string[];
  
  // Acciones de la derecha
  onImportClick: () => void;
  onNewMovementClick: () => void;
  
  // Opcional: restricciones
  customRestricted?: ReactNode;
}

export const ActionBarDesktopRow: React.FC<ActionBarDesktopRowProps> = ({
  filterByType,
  setFilterByType,
  availableTypes,
  filterByCategory,
  setFilterByCategory,
  availableCategories,
  filterByFavorites,
  setFilterByFavorites,
  filterByCurrency,
  setFilterByCurrency,
  availableCurrencies,
  filterByWallet,
  setFilterByWallet,
  availableWallets,
  onImportClick,
  onNewMovementClick,
  customRestricted
}) => {
  return (
    <div 
      className="hidden md:flex flex-col rounded-lg border border-[var(--actionbar-border)] mb-6 shadow-lg"
      style={{ backgroundColor: "var(--actionbar-bg)", color: "var(--actionbar-text)" }}
    >
      <div className="flex items-center justify-between px-4 py-3">
        {/* Filtros a la izquierda - EXACTO como en la tabla */}
        <div className="flex items-center gap-2">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                className="h-8 px-3 text-xs"
              >
                <Tag className="w-4 h-4 mr-1" />
                Tipo
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="w-48">
              <DropdownMenuItem onClick={() => setFilterByType("all")}>
                Todos los tipos
              </DropdownMenuItem>
              {availableTypes.map((type) => (
                <DropdownMenuItem key={type} onClick={() => setFilterByType(type!)}>
                  {type}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
          
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                className="h-8 px-3 text-xs"
              >
                <FolderTree className="w-4 h-4 mr-1" />
                Categoría
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="w-48">
              <DropdownMenuItem onClick={() => setFilterByCategory("all")}>
                Todas las categorías
              </DropdownMenuItem>
              {availableCategories.map((category) => (
                <DropdownMenuItem key={category} onClick={() => setFilterByCategory(category!)}>
                  {category}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
          
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                className="h-8 px-3 text-xs"
              >
                <Star className="w-4 h-4 mr-1" />
                Favoritos
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="w-48">
              <DropdownMenuItem onClick={() => setFilterByFavorites("all")}>
                Todos los movimientos
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setFilterByFavorites("favorites")}>
                Solo favoritos
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                className="h-8 px-3 text-xs"
              >
                <Coins className="w-4 h-4 mr-1" />
                Moneda
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="w-48">
              <DropdownMenuItem onClick={() => setFilterByCurrency("all")}>
                Todas las monedas
              </DropdownMenuItem>
              {availableCurrencies.map((currency) => (
                <DropdownMenuItem key={currency} onClick={() => setFilterByCurrency(currency!)}>
                  {currency}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
          
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                className="h-8 px-3 text-xs"
              >
                <Wallet className="w-4 h-4 mr-1" />
                Billetera
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="w-48">
              <DropdownMenuItem onClick={() => setFilterByWallet("all")}>
                Todas las billeteras
              </DropdownMenuItem>
              {availableWallets.map((wallet) => (
                <DropdownMenuItem key={wallet} onClick={() => setFilterByWallet(wallet!)}>
                  {wallet}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {/* Acciones a la derecha - EXACTO como en la tabla */}
        <div className="flex items-center gap-2">
          {customRestricted || (
            <Button
              variant="secondary"
              size="sm"
              onClick={onImportClick}
              className="h-8 px-3 text-xs"
            >
              <Upload className="mr-1 h-3 w-3" />
              Importar
            </Button>
          )}
          <Button
            variant="default"
            size="sm"
            onClick={onNewMovementClick}
            className="h-8 px-3 text-xs"
          >
            <Plus className="mr-1 h-3 w-3" />
            Nuevo movimiento
          </Button>
        </div>
      </div>
    </div>
  );
};