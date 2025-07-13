import React, { useState, useEffect } from 'react';
import { Check, ChevronsUpDown, FolderPlus } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { useDesignDocumentFolders, useCreateDesignDocumentFolder } from '@/hooks/use-design-document-folders';
import { useToast } from '@/hooks/use-toast';

interface FolderComboBoxProps {
  value?: string;
  onValueChange: (value: string) => void;
  placeholder?: string;
  className?: string;
  disabled?: boolean;
}

export function FolderComboBox({
  value,
  onValueChange,
  placeholder = "Seleccionar carpeta...",
  className,
  disabled = false
}: FolderComboBoxProps) {
  const [open, setOpen] = useState(false);
  const [searchValue, setSearchValue] = useState('');
  const { data: folders = [], isLoading } = useDesignDocumentFolders();
  const createFolderMutation = useCreateDesignDocumentFolder();
  const { toast } = useToast();

  // Find selected folder
  const selectedFolder = folders.find(folder => folder.id === value);

  // Filter folders based on search
  const filteredFolders = folders.filter(folder =>
    folder.name.toLowerCase().includes(searchValue.toLowerCase())
  );

  // Check if search value would create a new folder
  const canCreateNew = searchValue.trim() && 
    !folders.some(folder => folder.name.toLowerCase() === searchValue.toLowerCase().trim());

  const handleSelect = (folderId: string) => {
    onValueChange(folderId);
    setOpen(false);
    setSearchValue('');
  };

  const handleCreateFolder = async () => {
    if (!searchValue.trim()) return;

    try {
      const newFolder = await createFolderMutation.mutateAsync(searchValue.trim());
      onValueChange(newFolder.id);
      setOpen(false);
      setSearchValue('');
      toast({
        title: "Carpeta creada",
        description: `La carpeta "${newFolder.name}" ha sido creada exitosamente.`
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "No se pudo crear la carpeta",
        variant: "destructive"
      });
    }
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <div
          role="combobox"
          aria-expanded={open}
          className={cn(
            "flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 cursor-pointer",
            className
          )}
          onClick={() => !disabled && !isLoading && setOpen(!open)}
        >
          <span className={selectedFolder ? "text-foreground" : "text-muted-foreground"}>
            {selectedFolder ? selectedFolder.name : placeholder}
          </span>
          <ChevronsUpDown className="h-4 w-4 opacity-50" />
        </div>
      </PopoverTrigger>
      <PopoverContent className="w-[--radix-popover-trigger-width] p-0" align="start" style={{ zIndex: 9999 }}>
        <Command>
          <CommandInput 
            placeholder="Buscar o crear carpeta..." 
            value={searchValue}
            onValueChange={setSearchValue}
          />
          <CommandList>
            {filteredFolders.length === 0 && !canCreateNew && (
              <CommandEmpty>No se encontraron carpetas.</CommandEmpty>
            )}
            
            {filteredFolders.length > 0 && (
              <CommandGroup>
                {filteredFolders.map((folder) => (
                  <CommandItem
                    key={folder.id}
                    value={folder.id}
                    onSelect={() => handleSelect(folder.id)}
                    className="cursor-pointer"
                  >
                    <Check
                      className={cn(
                        "mr-2 h-4 w-4",
                        value === folder.id ? "opacity-100" : "opacity-0"
                      )}
                    />
                    {folder.name}
                  </CommandItem>
                ))}
              </CommandGroup>
            )}

            {canCreateNew && (
              <CommandGroup>
                <CommandItem
                  value={`create-${searchValue}`}
                  onSelect={handleCreateFolder}
                  className="cursor-pointer text-accent-foreground"
                  disabled={createFolderMutation.isPending}
                >
                  <FolderPlus className="mr-2 h-4 w-4" />
                  {createFolderMutation.isPending 
                    ? `Creando "${searchValue.trim()}"...`
                    : `Crear "${searchValue.trim()}"`
                  }
                </CommandItem>
              </CommandGroup>
            )}
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}