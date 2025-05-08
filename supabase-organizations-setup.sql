-- Crear la tabla de organizaciones
CREATE TABLE IF NOT EXISTS "organizations" (
  "id" SERIAL PRIMARY KEY,
  "name" VARCHAR(255) NOT NULL,
  "description" TEXT,
  "address" TEXT,
  "phone" VARCHAR(50),
  "email" VARCHAR(255),
  "website" VARCHAR(255),
  "taxId" VARCHAR(100),
  "logoUrl" TEXT,
  "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Crear tabla para configuración PDF de organizaciones
CREATE TABLE IF NOT EXISTS "organization_pdf_configs" (
  "id" SERIAL PRIMARY KEY,
  "organizationId" INTEGER NOT NULL REFERENCES "organizations"("id") ON DELETE CASCADE,
  "logoPosition" VARCHAR(10) DEFAULT 'left',
  "showAddress" BOOLEAN DEFAULT true,
  "showPhone" BOOLEAN DEFAULT true,
  "showEmail" BOOLEAN DEFAULT true,
  "showWebsite" BOOLEAN DEFAULT true,
  "showTaxId" BOOLEAN DEFAULT true,
  "primaryColor" VARCHAR(20) DEFAULT '#92c900',
  "secondaryColor" VARCHAR(20) DEFAULT '#f0f0f0',
  "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Crear tabla para usuarios de organizaciones
CREATE TABLE IF NOT EXISTS "organization_users" (
  "id" SERIAL PRIMARY KEY,
  "organizationId" INTEGER NOT NULL REFERENCES "organizations"("id") ON DELETE CASCADE,
  "userId" INTEGER NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
  "role" VARCHAR(20) NOT NULL DEFAULT 'member',
  "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  UNIQUE("organizationId", "userId")
);

-- Agregar columnas a la tabla projects para datos del cliente
ALTER TABLE "projects" 
ADD COLUMN IF NOT EXISTS "clientName" VARCHAR(255),
ADD COLUMN IF NOT EXISTS "clientAddress" TEXT,
ADD COLUMN IF NOT EXISTS "clientPhone" VARCHAR(50),
ADD COLUMN IF NOT EXISTS "clientEmail" VARCHAR(255),
ADD COLUMN IF NOT EXISTS "organizationId" INTEGER REFERENCES "organizations"("id") ON DELETE SET NULL;

-- Insertar la organización por defecto
INSERT INTO "organizations" ("name", "description", "address", "phone", "email", "website", "taxId")
VALUES ('Construcciones XYZ', 'Empresa dedicada a proyectos de construcción y remodelación', 'Av. Principal 123, Ciudad', '+58 212 555-1234', 'contacto@construccionesxyz.com', 'www.construccionesxyz.com', 'J-12345678-9')
ON CONFLICT DO NOTHING;

-- Insertar configuración PDF para la organización por defecto
INSERT INTO "organization_pdf_configs" ("organizationId", "logoPosition", "showAddress", "showPhone", "showEmail", "showWebsite", "showTaxId", "primaryColor", "secondaryColor")
VALUES (
  (SELECT id FROM "organizations" WHERE "name" = 'Construcciones XYZ'),
  'left', true, true, true, true, true, '#92c900', '#f0f0f0'
)
ON CONFLICT DO NOTHING;

-- Agregar usuario admin a la organización por defecto
INSERT INTO "organization_users" ("organizationId", "userId", "role")
VALUES (
  (SELECT id FROM "organizations" WHERE "name" = 'Construcciones XYZ'),
  (SELECT id FROM "users" WHERE "username" = 'admin'),
  'owner'
)
ON CONFLICT DO NOTHING;

-- Actualizar proyectos existentes para asignarlos a la organización por defecto
UPDATE "projects"
SET "organizationId" = (SELECT id FROM "organizations" WHERE "name" = 'Construcciones XYZ')
WHERE "organizationId" IS NULL;

-- Actualizar información de cliente en proyectos existentes
UPDATE "projects"
SET 
  "clientName" = 'Cliente Demo',
  "clientAddress" = 'Calle Principal 456, Ciudad',
  "clientPhone" = '+58 212 555-5678',
  "clientEmail" = 'cliente@ejemplo.com'
WHERE "clientName" IS NULL;

-- Trigger para actualizar el timestamp de updated_at
CREATE OR REPLACE FUNCTION update_modified_column()
RETURNS TRIGGER AS $$
BEGIN
   NEW."updatedAt" = now(); 
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