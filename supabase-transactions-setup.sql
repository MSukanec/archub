-- Este script configura la tabla de transacciones para Supabase

-- Crear la tabla si no existe
CREATE TABLE IF NOT EXISTS transactions (
  id SERIAL PRIMARY KEY,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  project_id INTEGER NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  type VARCHAR(50) NOT NULL,
  category VARCHAR(100) NOT NULL,
  description TEXT NOT NULL,
  amount DECIMAL(12, 2) NOT NULL
);

-- Crear índices para mejorar el rendimiento
CREATE INDEX IF NOT EXISTS idx_transactions_project_id ON transactions(project_id);
CREATE INDEX IF NOT EXISTS idx_transactions_date ON transactions(date);
CREATE INDEX IF NOT EXISTS idx_transactions_type ON transactions(type);
CREATE INDEX IF NOT EXISTS idx_transactions_category ON transactions(category);

-- Actualizar el trigger de updated_at
DROP TRIGGER IF EXISTS set_updated_at_timestamp_transactions ON transactions;
CREATE TRIGGER set_updated_at_timestamp_transactions
BEFORE UPDATE ON transactions
FOR EACH ROW
EXECUTE FUNCTION set_updated_at_column();

-- Establecer políticas de seguridad (RLS)
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;

-- Políticas para transacciones
DROP POLICY IF EXISTS "Usuarios pueden ver transacciones de proyectos a los que tienen acceso" ON transactions;
CREATE POLICY "Usuarios pueden ver transacciones de proyectos a los que tienen acceso" 
ON transactions FOR SELECT 
USING (
  project_id IN (
    SELECT p.id FROM projects p
    LEFT JOIN organization_users ou ON p.organization_id = ou.organization_id
    WHERE p.user_id = auth.uid() OR ou.user_id = auth.uid()
  )
);

DROP POLICY IF EXISTS "Usuarios pueden insertar transacciones en proyectos a los que tienen acceso" ON transactions;
CREATE POLICY "Usuarios pueden insertar transacciones en proyectos a los que tienen acceso" 
ON transactions FOR INSERT 
WITH CHECK (
  project_id IN (
    SELECT p.id FROM projects p
    LEFT JOIN organization_users ou ON p.organization_id = ou.organization_id
    WHERE p.user_id = auth.uid() OR ou.user_id = auth.uid()
  )
);

DROP POLICY IF EXISTS "Usuarios pueden actualizar transacciones en proyectos a los que tienen acceso" ON transactions;
CREATE POLICY "Usuarios pueden actualizar transacciones en proyectos a los que tienen acceso" 
ON transactions FOR UPDATE
USING (
  project_id IN (
    SELECT p.id FROM projects p
    LEFT JOIN organization_users ou ON p.organization_id = ou.organization_id
    WHERE p.user_id = auth.uid() OR ou.user_id = auth.uid()
  )
);

DROP POLICY IF EXISTS "Usuarios pueden eliminar transacciones en proyectos a los que tienen acceso" ON transactions;
CREATE POLICY "Usuarios pueden eliminar transacciones en proyectos a los que tienen acceso" 
ON transactions FOR DELETE
USING (
  project_id IN (
    SELECT p.id FROM projects p
    LEFT JOIN organization_users ou ON p.organization_id = ou.organization_id
    WHERE p.user_id = auth.uid() OR ou.user_id = auth.uid()
  )
);