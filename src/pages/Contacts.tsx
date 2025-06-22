import { useQuery, useMutation } from "@tanstack/react-query";
import { useState } from "react";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { Users, Plus, Edit, Trash2, MoreHorizontal, Mail, Phone, Building, MapPin } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";

import { useCurrentUser } from "@/hooks/use-current-user";
import { useContacts } from "@/hooks/use-contacts";
import { useContactTypes } from "@/hooks/use-contact-types";
import { NewContactModal } from "@/modals/NewContactModal";
import { supabase } from "@/lib/supabase";
import { useToast } from "@/hooks/use-toast";
import { queryClient } from "@/lib/queryClient";

interface Contact {
  id: string;
  organization_id: string;
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  company_name: string;
  location: string;
  notes: string;
  contact_type_id: string;
  created_at: string;
  contact_type?: {
    id: string;
    name: string;
  };
}

export default function Contacts() {
  const { toast } = useToast();
  const { data: userData } = useCurrentUser();
  const [openModal, setOpenModal] = useState(false);
  const [searchValue, setSearchValue] = useState('');
  const [editingContact, setEditingContact] = useState<Contact | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [contactToDelete, setContactToDelete] = useState<Contact | null>(null);
  
  // Filter states
  const [sortBy, setSortBy] = useState('name_asc');
  const [filterByType, setFilterByType] = useState('all');

  const organizationId = userData?.preferences?.last_organization_id;
  const { data: contacts = [], isLoading, error } = useContacts(organizationId);
  const { data: contactTypes = [] } = useContactTypes();

  let filteredContacts = contacts.filter(contact => {
    // Search filter
    const matchesSearch = !searchValue || 
      contact.first_name.toLowerCase().includes(searchValue.toLowerCase()) ||
      contact.last_name.toLowerCase().includes(searchValue.toLowerCase()) ||
      contact.email.toLowerCase().includes(searchValue.toLowerCase()) ||
      contact.company_name.toLowerCase().includes(searchValue.toLowerCase()) ||
      contact.location.toLowerCase().includes(searchValue.toLowerCase());
    
    // Type filter
    const matchesType = filterByType === 'all' || contact.contact_type_id === filterByType;
    
    return matchesSearch && matchesType;
  });

  // Apply sorting
  filteredContacts = [...filteredContacts].sort((a, b) => {
    switch (sortBy) {
      case 'name_asc':
        return `${a.first_name} ${a.last_name}`.localeCompare(`${b.first_name} ${b.last_name}`);
      case 'name_desc':
        return `${b.first_name} ${b.last_name}`.localeCompare(`${a.first_name} ${a.last_name}`);
      case 'date_recent':
        return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
      case 'date_old':
        return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
      default:
        return `${a.first_name} ${a.last_name}`.localeCompare(`${b.first_name} ${b.last_name}`);
    }
  });

  const handleClearFilters = () => {
    setSortBy('name_asc');
    setFilterByType('all');
    setSearchValue('');
  };

  const customFilters = (
    <div className="space-y-4">
      <div>
        <Label className="text-xs font-medium text-muted-foreground">Ordenar por</Label>
        <Select value={sortBy} onValueChange={setSortBy}>
          <SelectTrigger className="mt-1">
            <SelectValue placeholder="Seleccionar orden" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="name_asc">Nombre A-Z</SelectItem>
            <SelectItem value="name_desc">Nombre Z-A</SelectItem>
            <SelectItem value="date_recent">Fecha reciente</SelectItem>
            <SelectItem value="date_old">Fecha antigua</SelectItem>
          </SelectContent>
        </Select>
      </div>
      
      <div>
        <Label className="text-xs font-medium text-muted-foreground">Tipo de contacto</Label>
        <Select value={filterByType} onValueChange={setFilterByType}>
          <SelectTrigger className="mt-1">
            <SelectValue placeholder="Todos los tipos" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos los tipos</SelectItem>
            {contactTypes.map((type) => (
              <SelectItem key={type.id} value={type.id}>
                {type.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </div>
  );

  const actions = (
    <Button variant="default" onClick={() => setOpenModal(true)}>
      <Plus className="mr-2 h-4 w-4" />
      Nuevo contacto
    </Button>
  );

  const formatDate = (dateStr: string) => {
    return format(new Date(dateStr), 'dd MMM yyyy', { locale: es });
  };

  const handleEdit = (contact: Contact) => {
    setEditingContact(contact);
    setOpenModal(true);
  };

  const handleDeleteClick = (contact: Contact) => {
    setContactToDelete(contact);
    setDeleteDialogOpen(true);
  };

  const deleteContactMutation = useMutation({
    mutationFn: async (contactId: string) => {
      if (!supabase) {
        throw new Error('Supabase client not initialized');
      }

      const { error } = await supabase
        .from('contacts')
        .delete()
        .eq('id', contactId);

      if (error) {
        throw new Error(`Error al eliminar contacto: ${error.message}`);
      }
    },
    onSuccess: () => {
      toast({
        title: "Éxito",
        description: "Contacto eliminado correctamente"
      });
      queryClient.invalidateQueries({ queryKey: ['contacts', organizationId] });
      setDeleteDialogOpen(false);
      setContactToDelete(null);
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "No se pudo eliminar el contacto",
        variant: "destructive"
      });
    }
  });

  const handleConfirmDelete = () => {
    if (contactToDelete) {
      deleteContactMutation.mutate(contactToDelete.id);
    }
  };

  const handleCloseModal = () => {
    setOpenModal(false);
    setEditingContact(null);
  };

  const headerProps = {
    title: "Contactos",
    showSearch: true,
    searchValue,
    onSearchChange: setSearchValue,
    showFilters: true,
    customFilters,
    onClearFilters: handleClearFilters,
    actions
  };

  if (isLoading) {
    return (
      <Layout headerProps={headerProps}>
        <div className="p-8 text-center text-muted-foreground">
          Cargando contactos...
        </div>
      </Layout>
    );
  }

  if (error) {
    return (
      <Layout headerProps={headerProps}>
        <div className="p-8 text-center text-muted-foreground">
          Error al cargar los contactos: {(error as Error).message}
        </div>
      </Layout>
    );
  }

  return (
    <Layout headerProps={headerProps}>
        {filteredContacts.length === 0 ? (
          <div className="p-8 text-center text-muted-foreground">
            {contacts.length === 0 
              ? "No hay contactos registrados. Agrega el primer contacto de tu organización."
              : "No se encontraron contactos que coincidan con tu búsqueda."
            }
          </div>
        ) : (
          <div className="space-y-0">
            {/* Column Headers */}
            <div className="grid grid-cols-12 gap-4 px-4 py-3 text-xs font-medium text-muted-foreground border-b border-[var(--card-border)]">
              <div className="col-span-3">Nombre completo</div>
              <div className="col-span-2">Email</div>
              <div className="col-span-2">Teléfono</div>
              <div className="col-span-2">Tipo</div>
              <div className="col-span-2">Empresa / Ubicación</div>
              <div className="col-span-1">Acciones</div>
            </div>

            {/* Contact Cards */}
            {filteredContacts.map((contact) => (
              <Card 
                key={contact.id}
                className="rounded-none border-x-0 border-t-0 border-b border-[var(--card-border)]"
              >
                <div className="grid grid-cols-12 gap-4 px-4 py-4 text-sm hover:bg-[var(--card-bg)] transition-colors">
                  <div className="col-span-3">
                    <div className="flex items-center gap-3">
                      <div className="h-8 w-8 rounded-full bg-blue-100 dark:bg-blue-900 flex items-center justify-center text-sm font-medium text-blue-600 dark:text-blue-300">
                        {contact.first_name.charAt(0)}{contact.last_name.charAt(0)}
                      </div>
                      <div>
                        <div className="font-medium text-foreground">
                          {contact.first_name} {contact.last_name}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {formatDate(contact.created_at)}
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  <div className="col-span-2">
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Mail className="h-3 w-3" />
                      <span className="truncate text-xs">{contact.email}</span>
                    </div>
                  </div>
                  
                  <div className="col-span-2">
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Phone className="h-3 w-3" />
                      <span className="text-xs">{contact.phone}</span>
                    </div>
                  </div>
                  
                  <div className="col-span-2">
                    <Badge variant="secondary" className="text-xs">
                      {contact.contact_type?.name || 'Sin tipo'}
                    </Badge>
                  </div>
                  
                  <div className="col-span-2">
                    <div className="space-y-1">
                      {contact.company_name && (
                        <div className="flex items-center gap-2 text-muted-foreground">
                          <Building className="h-3 w-3" />
                          <span className="truncate text-xs">{contact.company_name}</span>
                        </div>
                      )}
                      {contact.location && (
                        <div className="flex items-center gap-2 text-muted-foreground">
                          <MapPin className="h-3 w-3" />
                          <span className="truncate text-xs">{contact.location}</span>
                        </div>
                      )}
                      {!contact.company_name && !contact.location && (
                        <span className="text-xs text-muted-foreground">-</span>
                      )}
                    </div>
                  </div>
                  
                  <div className="col-span-1">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => handleEdit(contact)}>
                          <Edit className="mr-2 h-4 w-4" />
                          Editar
                        </DropdownMenuItem>
                        <DropdownMenuItem 
                          onClick={() => handleDeleteClick(contact)}
                          className="text-destructive"
                        >
                          <Trash2 className="mr-2 h-4 w-4" />
                          Eliminar
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}
      

      <NewContactModal
        open={openModal}
        onClose={handleCloseModal}
        editingContact={editingContact}
      />

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Eliminar contacto?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción no se puede deshacer. Se eliminará permanentemente este contacto de tu organización.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleConfirmDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              disabled={deleteContactMutation.isPending}
            >
              {deleteContactMutation.isPending ? 'Eliminando...' : 'Eliminar'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Layout>
  );
}