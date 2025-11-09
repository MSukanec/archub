import { useState, useEffect } from 'react'
import { useMutation, useQueryClient, useQuery } from '@tanstack/react-query'
import { useToast } from '@/hooks/use-toast'
import { supabase } from '@/lib/supabase'
import { useDebouncedAutoSave } from '@/components/save'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { BookOpen, Eye, DollarSign, Plus, Trash2 } from 'lucide-react'
import CourseHeroImageUpload from '@/components/learning/CourseHeroImageUpload'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Button } from '@/components/ui/button'

interface AdminCourseDataTabProps {
  courseId?: string;
}

interface CoursePrice {
  id: string;
  course_id: string;
  currency_code: string;
  amount: number;
  provider: string;
  is_active: boolean;
  months: number | null;
}

export default function AdminCourseDataTab({ courseId }: AdminCourseDataTabProps) {
  const { toast } = useToast()
  const queryClient = useQueryClient()

  // Form states
  const [title, setTitle] = useState('')
  const [slug, setSlug] = useState('')
  const [shortDescription, setShortDescription] = useState('')
  const [coverUrl, setCoverUrl] = useState('')
  const [visibility, setVisibility] = useState('public')
  const [isActive, setIsActive] = useState(true)

  // Pricing states
  const [newPriceProvider, setNewPriceProvider] = useState('any')
  const [newPriceCurrency, setNewPriceCurrency] = useState('ARS')
  const [newPriceAmount, setNewPriceAmount] = useState('')
  const [newPriceMonths, setNewPriceMonths] = useState('')

  // Get course data
  const { data: courseData } = useQuery({
    queryKey: ['/api/admin/courses', courseId],
    queryFn: async () => {
      if (!courseId || !supabase) return null;
      
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return null;

      const res = await fetch(`/api/admin/courses/${courseId}`, {
        headers: {
          'Authorization': `Bearer ${session.access_token}`
        },
        credentials: 'include'
      });

      if (!res.ok) throw new Error('Failed to fetch course');
      return res.json();
    },
    enabled: !!courseId && !!supabase
  });

  // Query para obtener los precios del curso
  const { data: prices = [], refetch: refetchPrices } = useQuery({
    queryKey: ['course-prices', courseId],
    queryFn: async () => {
      if (!courseId || !supabase) return [];
      
      const { data, error } = await supabase
        .from('course_prices')
        .select('*')
        .eq('course_id', courseId)
        .order('currency_code', { ascending: true });
      
      if (error) throw error;
      return data as CoursePrice[];
    },
    enabled: !!courseId
  });

  // Auto-save mutation for course data
  const saveCourseDataMutation = useMutation({
    mutationFn: async (dataToSave: any) => {
      if (!courseId || !supabase) return;

      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error('No session');

      const res = await fetch(`/api/admin/courses/${courseId}`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json'
        },
        credentials: 'include',
        body: JSON.stringify({
          ...dataToSave,
          updated_at: new Date().toISOString()
        })
      });

      if (!res.ok) throw new Error('Failed to update course');
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/courses', courseId] });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/courses'] });
      queryClient.invalidateQueries({ queryKey: ['courses'] });
      toast({
        title: "Cambios guardados",
        description: "Los datos del curso se han guardado automáticamente"
      });
    },
    onError: (error: any) => {
      console.error('Error in saveCourseDataMutation:', error);
      toast({
        title: "Error al guardar",
        description: "No se pudieron guardar los cambios del curso",
        variant: "destructive"
      });
    }
  });

  // Mutación para crear precio
  const createPriceMutation = useMutation({
    mutationFn: async () => {
      if (!supabase || !courseId) throw new Error('No course selected');
      if (!newPriceAmount || parseFloat(newPriceAmount) <= 0) {
        throw new Error('El monto debe ser mayor a 0');
      }

      let monthsValue = null;
      if (newPriceMonths) {
        const parsed = parseInt(newPriceMonths);
        if (Number.isNaN(parsed)) {
          throw new Error('La cantidad de meses debe ser un número válido');
        }
        monthsValue = parsed;
      }

      const { error } = await supabase
        .from('course_prices')
        .insert({
          course_id: courseId,
          currency_code: newPriceCurrency,
          amount: parseFloat(newPriceAmount),
          provider: newPriceProvider,
          is_active: true,
          months: monthsValue
        });

      if (error) throw error;
    },
    onSuccess: () => {
      refetchPrices();
      setNewPriceAmount('');
      setNewPriceMonths('');
      setNewPriceProvider('any');
      setNewPriceCurrency('ARS');
      toast({
        title: 'Precio agregado',
        description: 'El precio se agregó correctamente.'
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error.message || 'No se pudo agregar el precio.',
        variant: 'destructive'
      });
    }
  });

  // Mutación para eliminar precio
  const deletePriceMutation = useMutation({
    mutationFn: async (priceId: string) => {
      if (!supabase) throw new Error('Supabase not initialized');

      const { error } = await supabase
        .from('course_prices')
        .delete()
        .eq('id', priceId);

      if (error) throw error;
    },
    onSuccess: () => {
      refetchPrices();
      toast({
        title: 'Precio eliminado',
        description: 'El precio se eliminó correctamente.'
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error.message || 'No se pudo eliminar el precio.',
        variant: 'destructive'
      });
    }
  });

  // Auto-save hook
  const { isSaving } = useDebouncedAutoSave({
    data: {
      title,
      slug,
      short_description: shortDescription,
      cover_url: coverUrl,
      visibility,
      is_active: isActive
    },
    saveFn: (data) => saveCourseDataMutation.mutateAsync(data),
    delay: 1500
  });

  // Load data when course changes or data is fetched
  useEffect(() => {
    if (courseData) {
      setTitle(courseData.title || '');
      setSlug(courseData.slug || '');
      setShortDescription(courseData.short_description || '');
      setCoverUrl(courseData.cover_url || '');
      setVisibility(courseData.visibility || 'public');
      setIsActive(courseData.is_active ?? true);
    }
  }, [courseData]);

  if (!courseId) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-muted-foreground">No hay curso seleccionado</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Hero Image Section */}
      <CourseHeroImageUpload
        courseId={courseId}
        currentImageUrl={coverUrl}
        onImageUpdate={(url) => setCoverUrl(url || '')}
      />

      <hr className="border-t border-[var(--section-divider)] my-8" />

      {/* Two Column Layout - Section descriptions left, content right */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Left Column - Información Básica */}
        <div>
          <div className="flex items-center gap-2 mb-6">
            <BookOpen className="h-5 w-5 text-[var(--accent)]" />
            <h2 className="text-lg font-semibold">Información Básica</h2>
          </div>
          <p className="text-sm text-muted-foreground">
            Datos fundamentales del curso que se mostrarán a los estudiantes. Estos campos son la base para la visualización y búsqueda del curso.
          </p>
        </div>

        {/* Right Column - Información Básica Content */}
        <div>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="course-title">Título del Curso</Label>
              <Input 
                id="course-title"
                placeholder="Ej: Introducción a la Construcción Sostenible"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="course-slug">Slug (URL amigable)</Label>
              <Input 
                id="course-slug"
                placeholder="Ej: introduccion-construccion-sostenible"
                value={slug}
                onChange={(e) => setSlug(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="short-description">Descripción Corta</Label>
              <Textarea 
                id="short-description"
                placeholder="Breve descripción del curso (máximo 200 caracteres)..."
                value={shortDescription}
                onChange={(e) => setShortDescription(e.target.value)}
                rows={2}
              />
            </div>
          </div>
        </div>
      </div>

      <hr className="border-t border-[var(--section-divider)] my-8" />

      {/* Sección de Precios */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Left Column - Precios */}
        <div>
          <div className="flex items-center gap-2 mb-6">
            <DollarSign className="h-5 w-5 text-[var(--accent)]" />
            <h2 className="text-lg font-semibold">Precios del Curso</h2>
          </div>
          <p className="text-sm text-muted-foreground">
            Configura los precios según la moneda y el proveedor de pago. Puedes asignar diferentes precios para cada combinación de moneda y proveedor (MercadoPago, PayPal, o cualquiera). También puedes especificar la duración de la suscripción en meses.
          </p>
        </div>

        {/* Right Column - Precios Content */}
        <div>
          <div className="space-y-4">
            {/* Lista de precios existentes */}
            {prices.length > 0 && (
              <div className="space-y-2">
                {prices.map((price) => (
                  <div
                    key={price.id}
                    className="flex items-center justify-between p-3 border rounded-lg"
                  >
                    <div className="flex items-center gap-4 flex-wrap">
                      <div className="font-medium">
                        {price.currency_code} ${Number(price.amount).toFixed(2)}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {price.provider === 'any' ? 'Cualquier proveedor' : 
                         price.provider === 'mercadopago' ? 'MercadoPago' : 'PayPal'}
                      </div>
                      {price.months !== null && (
                        <Badge variant="secondary" className="text-xs">
                          {price.months} {price.months === 1 ? 'mes' : 'meses'}
                        </Badge>
                      )}
                    </div>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => deletePriceMutation.mutate(price.id)}
                      disabled={deletePriceMutation.isPending}
                      data-testid={`button-delete-price-${price.id}`}
                    >
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                ))}
              </div>
            )}

            {prices.length === 0 && (
              <div className="text-sm text-muted-foreground p-4 border rounded-lg bg-muted/20">
                No hay precios configurados para este curso
              </div>
            )}

            {/* Formulario para agregar nuevo precio */}
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-sm font-medium mb-1 block">Proveedor</label>
                  <Select value={newPriceProvider} onValueChange={setNewPriceProvider}>
                    <SelectTrigger data-testid="select-new-price-provider">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="any">Cualquiera</SelectItem>
                      <SelectItem value="mercadopago">MercadoPago</SelectItem>
                      <SelectItem value="paypal">PayPal</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <label className="text-sm font-medium mb-1 block">Moneda</label>
                  <Select value={newPriceCurrency} onValueChange={setNewPriceCurrency}>
                    <SelectTrigger data-testid="select-new-price-currency">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="ARS">ARS</SelectItem>
                      <SelectItem value="USD">USD</SelectItem>
                      <SelectItem value="EUR">EUR</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-sm font-medium mb-1 block">Monto</label>
                  <Input
                    type="number"
                    step="0.01"
                    min="0"
                    value={newPriceAmount}
                    onChange={(e) => setNewPriceAmount(e.target.value)}
                    placeholder="0.00"
                    data-testid="input-new-price-amount"
                  />
                </div>

                <div>
                  <label className="text-sm font-medium mb-1 block">Meses (opcional)</label>
                  <Input
                    type="number"
                    step="1"
                    min="0"
                    value={newPriceMonths}
                    onChange={(e) => setNewPriceMonths(e.target.value)}
                    placeholder="Ej: 1, 3, 6, 12"
                    data-testid="input-new-price-months"
                  />
                </div>
              </div>

              <Button
                type="button"
                onClick={() => createPriceMutation.mutate()}
                disabled={createPriceMutation.isPending || !newPriceAmount}
                className="w-full"
                data-testid="button-add-price"
              >
                <Plus className="h-4 w-4 mr-1" />
                Agregar Precio
              </Button>
            </div>
          </div>
        </div>
      </div>

      <hr className="border-t border-[var(--section-divider)] my-8" />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Left Column - Configuración */}
        <div>
          <div className="flex items-center gap-2 mb-6">
            <Eye className="h-5 w-5 text-[var(--accent)]" />
            <h2 className="text-lg font-semibold">Configuración de Visibilidad</h2>
          </div>
          <p className="text-sm text-muted-foreground">
            Controla quién puede ver y acceder a este curso. Puedes hacer el curso público, privado o mantenerlo como borrador mientras trabajas en él.
          </p>
        </div>

        {/* Right Column - Configuración Content */}
        <div>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="visibility">Visibilidad</Label>
              <select 
                id="visibility"
                value={visibility}
                onChange={(e) => setVisibility(e.target.value)}
                className="w-full h-10 px-3 text-sm border rounded-md"
              >
                <option value="public">Público - Visible para todos</option>
                <option value="private">Privado - Solo usuarios autorizados</option>
                <option value="draft">Borrador - No visible</option>
              </select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="is-active">Estado del Curso</Label>
              <select 
                id="is-active"
                value={isActive ? 'active' : 'inactive'}
                onChange={(e) => setIsActive(e.target.value === 'active')}
                className="w-full h-10 px-3 text-sm border rounded-md"
              >
                <option value="active">Activo - Curso disponible</option>
                <option value="inactive">Inactivo - Curso pausado</option>
              </select>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
