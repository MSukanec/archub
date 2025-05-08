-- Crear la tabla de organizaciones
CREATE TABLE IF NOT EXISTS "organizations" (
  "id" SERIAL PRIMARY KEY,
  "name" VARCHAR(255) NOT NULL,
  "description" TEXT,
  "address" TEXT,
  "phone" VARCHAR(50),
  "email" VARCHAR(255),
  "website" VARCHAR(255),
  "tax_id" VARCHAR(100),
  "logo_url" TEXT,
  "created_at" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Crear tabla para configuración PDF de organizaciones
CREATE TABLE IF NOT EXISTS "organization_pdf_configs" (
  "id" SERIAL PRIMARY KEY,
  "organization_id" INTEGER NOT NULL REFERENCES "organizations"("id") ON DELETE CASCADE,
  "logo_position" VARCHAR(10) DEFAULT 'left',
  "show_address" BOOLEAN DEFAULT true,
  "show_phone" BOOLEAN DEFAULT true,
  "show_email" BOOLEAN DEFAULT true,
  "show_website" BOOLEAN DEFAULT true,
  "show_tax_id" BOOLEAN DEFAULT true,
  "primary_color" VARCHAR(20) DEFAULT '#92c900',
  "secondary_color" VARCHAR(20) DEFAULT '#f0f0f0',
  "created_at" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Crear tabla para usuarios de organizaciones
CREATE TABLE IF NOT EXISTS "organization_users" (
  "id" SERIAL PRIMARY KEY,
  "organization_id" INTEGER NOT NULL REFERENCES "organizations"("id") ON DELETE CASCADE,
  "user_id" INTEGER NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
  "role" VARCHAR(20) NOT NULL DEFAULT 'member',
  "created_at" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  UNIQUE("organization_id", "user_id")
);

-- Agregar columnas a la tabla projects para datos del cliente
ALTER TABLE "projects" 
ADD COLUMN IF NOT EXISTS "client_name" VARCHAR(255),
ADD COLUMN IF NOT EXISTS "client_address" TEXT,
ADD COLUMN IF NOT EXISTS "client_phone" VARCHAR(50),
ADD COLUMN IF NOT EXISTS "client_email" VARCHAR(255),
ADD COLUMN IF NOT EXISTS "organization_id" INTEGER REFERENCES "organizations"("id") ON DELETE SET NULL;

-- Insertar la organización por defecto
INSERT INTO "organizations" ("name", "description", "address", "phone", "email", "website", "tax_id")
VALUES ('Construcciones XYZ', 'Empresa dedicada a proyectos de construcción y remodelación', 'Av. Principal 123, Ciudad', '+58 212 555-1234', 'contacto@construccionesxyz.com', 'www.construccionesxyz.com', 'J-12345678-9')
ON CONFLICT DO NOTHING;

-- Insertar configuración PDF para la organización por defecto
INSERT INTO "organization_pdf_configs" ("organization_id", "logo_position", "show_address", "show_phone", "show_email", "show_website", "show_tax_id", "primary_color", "secondary_color")
VALUES (
  (SELECT id FROM "organizations" WHERE "name" = 'Construcciones XYZ'),
  'left', true, true, true, true, true, '#92c900', '#f0f0f0'
)
ON CONFLICT DO NOTHING;

-- Agregar usuario admin a la organización por defecto
INSERT INTO "organization_users" ("organization_id", "user_id", "role")
VALUES (
  (SELECT id FROM "organizations" WHERE "name" = 'Construcciones XYZ'),
  (SELECT id FROM "users" WHERE "username" = 'admin'),
  'owner'
)
ON CONFLICT DO NOTHING;

-- Actualizar proyectos existentes para asignarlos a la organización por defecto
UPDATE "projects"
SET "organization_id" = (SELECT id FROM "organizations" WHERE "name" = 'Construcciones XYZ')
WHERE "organization_id" IS NULL;

-- Actualizar información de cliente en proyectos existentes
UPDATE "projects"
SET 
  "client_name" = 'Cliente Demo',
  "client_address" = 'Calle Principal 456, Ciudad',
  "client_phone" = '+58 212 555-5678',
  "client_email" = 'cliente@ejemplo.com'
WHERE "client_name" IS NULL;

-- Trigger para actualizar el timestamp de updated_at
CREATE OR REPLACE FUNCTION update_modified_column()
RETURNS TRIGGER AS $$
BEGIN
   NEW."updated_at" = now(); 
   RETURN NEW;
END;
$$ language 'plpgsql';

-- Aplicar trigger a las tablas
CREATE TRIGGER update_organizations_modtime
BEFORE UPDATE ON "organizations"
FOR EACH ROW
EXECUTE PROCEDURE update_modified_column();

CREATE TRIGGER update_organization_pdf_configs_modtime
BEFORE UPDATE ON "organization_pdf_configs"
FOR EACH ROW
EXECUTE PROCEDURE update_modified_column();