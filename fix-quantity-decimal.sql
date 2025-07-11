-- Script para cambiar el tipo de dato de quantity de integer a numeric
-- para permitir valores decimales en la tabla budget_tasks

-- Cambiar el tipo de columna quantity de integer a numeric(10,2)
ALTER TABLE budget_tasks 
ALTER COLUMN quantity TYPE numeric(10,2);

-- Verificar el cambio
SELECT column_name, data_type, numeric_precision, numeric_scale 
FROM information_schema.columns 
WHERE table_name = 'budget_tasks' AND column_name = 'quantity';