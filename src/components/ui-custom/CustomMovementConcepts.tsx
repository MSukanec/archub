import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Trash2, Tags } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/lib/supabase';

interface MovementConcept {
  id: string;
  name: string;
  parent_id: string | null;
  organization_id: string | null;
}

interface CustomMovementConceptsProps {
  movementConcepts: MovementConcept[];
  organizationId: string;
  queryKey: string[];
}

export function CustomMovementConcepts({ 
  movementConcepts, 
  organizationId, 
  queryKey 
}: CustomMovementConceptsProps) {
  const [newConceptName, setNewConceptName] = useState('');
  const [selectedParentConcept, setSelectedParentConcept] = useState('');
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Helper functions for concepts organization
  const getParentConcepts = () => {
    return movementConcepts.filter(concept => concept.parent_id === null);
  };

  const getChildConcepts = (parentId: string) => {
    return movementConcepts.filter(concept => concept.parent_id === parentId);
  };

  // Create movement concept mutation
  const createConceptMutation = useMutation({
    mutationFn: async () => {
      if (!organizationId || !supabase || !newConceptName.trim() || !selectedParentConcept) {
        throw new Error('Datos requeridos faltantes');
      }

      const { error } = await supabase
        .from('movement_concepts')
        .insert({
          name: newConceptName.trim(),
          parent_id: selectedParentConcept,
          organization_id: organizationId,
        });

      if (error) throw error;
    },
    onSuccess: () => {
      toast({
        description: "Concepto creado exitosamente",
        duration: 2000,
      });
      setNewConceptName('');
      setSelectedParentConcept('');
      queryClient.invalidateQueries({ queryKey });
    },
    onError: (error) => {
      console.error('Error creating concept:', error);
      toast({
        title: "Error al crear concepto",
        description: "No se pudo crear el concepto. Inténtalo de nuevo.",
        variant: "destructive",
        duration: 4000,
      });
    },
  });

  // Delete movement concept mutation
  const deleteConceptMutation = useMutation({
    mutationFn: async (conceptId: string) => {
      if (!supabase) throw new Error('Supabase not initialized');

      const { error } = await supabase
        .from('movement_concepts')
        .delete()
        .eq('id', conceptId)
        .eq('organization_id', organizationId);

      if (error) throw error;
    },
    onSuccess: () => {
      toast({
        description: "Concepto eliminado exitosamente",
        duration: 2000,
      });
      queryClient.invalidateQueries({ queryKey });
    },
    onError: (error) => {
      console.error('Error deleting concept:', error);
      toast({
        title: "Error al eliminar concepto",
        description: "No se pudo eliminar el concepto. Inténtalo de nuevo.",
        variant: "destructive",
        duration: 4000,
      });
    },
  });

  return (
    <div>
        {/* Left Column - Title and Description */}
          </div>
            Gestiona los conceptos disponibles para categorizar movimientos financieros. 
            Puedes crear nuevos conceptos específicos para tu organización.
          </p>
        </div>

        {/* Right Column - Concepts Management */}
          {/* Add new concept form */}
            
              <Label htmlFor="parent-concept">Concepto padre</Label>
              <Select value={selectedParentConcept} onValueChange={setSelectedParentConcept}>
                <SelectTrigger>
                  <SelectValue placeholder="Seleccionar concepto padre" />
                </SelectTrigger>
                <SelectContent>
                  {getParentConcepts().map((concept) => (
                    <SelectItem key={concept.id} value={concept.id}>
                      {concept.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

              <Label htmlFor="concept-name">Nombre del concepto</Label>
              <Input
                id="concept-name"
                value={newConceptName}
                onChange={(e) => setNewConceptName(e.target.value)}
                placeholder="Ingresa el nombre del concepto"
              />
            </div>

            <Button 
              onClick={() => createConceptMutation.mutate()}
              disabled={!newConceptName.trim() || !selectedParentConcept || createConceptMutation.isPending}
            >
              {createConceptMutation.isPending ? 'Creando...' : 'Agregar Concepto'}
            </Button>
          </div>



          {/* Concepts hierarchy display */}
            
            {getParentConcepts().map((parentConcept) => (
                    {parentConcept.organization_id ? 'Personalizado' : 'Sistema'}
                  </span>
                </div>
                
                {/* Child concepts */}
                  {getChildConcepts(parentConcept.id).map((childConcept) => (
                          {childConcept.organization_id ? 'Personalizado' : 'Sistema'}
                        </span>
                        {childConcept.organization_id === organizationId && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => deleteConceptMutation.mutate(childConcept.id)}
                            disabled={deleteConceptMutation.isPending}
                          >
                          </Button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}