-- Crear la tabla categories si no existe
CREATE TABLE IF NOT EXISTS public.categories (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  "type" VARCHAR(50) NOT NULL DEFAULT 'material',
  position INTEGER NOT NULL DEFAULT 0,
  parent_id INTEGER REFERENCES public.categories(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Crear índices
CREATE INDEX IF NOT EXISTS idx_categories_type ON public.categories("type");
CREATE INDEX IF NOT EXISTS idx_categories_parent_id ON public.categories(parent_id);

-- Crear función para actualizar el timestamp de actualización
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
   NEW.updated_at = CURRENT_TIMESTAMP;
   RETURN NEW;
END;
$$ language 'plpgsql';

-- Crear trigger para actualizar el timestamp
DROP TRIGGER IF EXISTS update_categories_updated_at ON public.categories;
CREATE TRIGGER update_categories_updated_at
BEFORE UPDATE ON public.categories
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

-- Insertar categorías predeterminadas de materiales si la tabla está vacía
INSERT INTO public.categories (name, type, position)
SELECT 'Materiales de construcción', 'material', 1
WHERE NOT EXISTS (SELECT 1 FROM public.categories LIMIT 1);

INSERT INTO public.categories (name, type, position)
SELECT 'Materiales eléctricos', 'material', 2
WHERE EXISTS (SELECT 1 FROM public.categories WHERE name = 'Materiales de construcción');

INSERT INTO public.categories (name, type, position)
SELECT 'Materiales de plomería', 'material', 3
WHERE EXISTS (SELECT 1 FROM public.categories WHERE name = 'Materiales eléctricos');

INSERT INTO public.categories (name, type, position)
SELECT 'Acabados', 'material', 4
WHERE EXISTS (SELECT 1 FROM public.categories WHERE name = 'Materiales de plomería');

INSERT INTO public.categories (name, type, position)
SELECT 'Herramientas', 'material', 5
WHERE EXISTS (SELECT 1 FROM public.categories WHERE name = 'Acabados');

-- Insertar categorías predeterminadas de tareas
INSERT INTO public.categories (name, type, position)
SELECT 'Obra gruesa', 'task', 1
WHERE EXISTS (SELECT 1 FROM public.categories WHERE name = 'Herramientas');

INSERT INTO public.categories (name, type, position)
SELECT 'Instalaciones eléctricas', 'task', 2
WHERE EXISTS (SELECT 1 FROM public.categories WHERE name = 'Obra gruesa');

INSERT INTO public.categories (name, type, position)
SELECT 'Instalaciones sanitarias', 'task', 3
WHERE EXISTS (SELECT 1 FROM public.categories WHERE name = 'Instalaciones eléctricas');

INSERT INTO public.categories (name, type, position)
SELECT 'Acabados', 'task', 4
WHERE EXISTS (SELECT 1 FROM public.categories WHERE name = 'Instalaciones sanitarias');

INSERT INTO public.categories (name, type, position)
SELECT 'Limpieza', 'task', 5
WHERE EXISTS (SELECT 1 FROM public.categories WHERE name = 'Acabados' AND type = 'task');

-- Añadir permisos RLS
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;

-- Crear política que permite a todos los usuarios leer categorías
CREATE POLICY "Allow public read access" 
ON public.categories FOR SELECT 
USING (true);

-- Crear política que permite a los usuarios autenticados crear, actualizar y eliminar categorías
CREATE POLICY "Allow authenticated users to manage categories" 
ON public.categories FOR ALL 
USING (auth.role() = 'authenticated')
WITH CHECK (auth.role() = 'authenticated');