import { pool, db } from '../server/db.ts';
import { organizations, organizationUsers, users } from '../shared/schema.ts';
import { eq, and } from 'drizzle-orm';

async function ensureDefaultOrganization() {
  console.log('Verificando organización por defecto...');
  
  // Verificar si existe el usuario admin (ID = 1)
  const [adminUser] = await db.select().from(users).where(eq(users.id, 1));
  
  if (!adminUser) {
    console.log('No se encontró el usuario admin');
    return;
  }
  
  console.log('Usuario admin encontrado:', adminUser);
  
  // Verificar si existe la organización por defecto
  let defaultOrg = null;
  const existingOrgs = await db.select().from(organizations);
  
  if (existingOrgs.length > 0) {
    defaultOrg = existingOrgs[0];
    console.log('Organización encontrada:', defaultOrg);
    
    // Actualizar el pdfConfig si no existe
    if (!defaultOrg.pdfConfig) {
      const [updatedOrg] = await db.update(organizations)
        .set({ 
          pdfConfig: '{"primaryColor":"#92c900","secondaryColor":"#707070","logoPosition":"left","showFooter":true,"showHeader":true}'
        })
        .where(eq(organizations.id, defaultOrg.id))
        .returning();
      
      defaultOrg = updatedOrg;
      console.log('Organización actualizada con pdfConfig:', defaultOrg);
    }
  } else {
    // Crear la organización por defecto
    const [newOrg] = await db.insert(organizations).values({
      name: 'Construcciones XYZ',
      description: 'Organización por defecto',
      pdfConfig: '{"primaryColor":"#92c900","secondaryColor":"#707070","logoPosition":"left","showFooter":true,"showHeader":true}'
    }).returning();
    
    defaultOrg = newOrg;
    console.log('Organización creada:', defaultOrg);
  }
  
  // Verificar si el usuario admin está asociado a la organización
  const [existingMembership] = await db.select()
    .from(organizationUsers)
    .where(
      and(
        eq(organizationUsers.userId, adminUser.id),
        eq(organizationUsers.organizationId, defaultOrg.id)
      )
    );
  
  if (existingMembership) {
    console.log('El usuario admin ya está asociado a la organización');
  } else {
    // Asociar el usuario admin a la organización como propietario
    const [membership] = await db.insert(organizationUsers).values({
      userId: adminUser.id,
      organizationId: defaultOrg.id,
      role: 'owner'
    }).returning();
    
    console.log('Usuario admin asociado a la organización:', membership);
  }
  
  console.log('Proceso completado');
}

ensureDefaultOrganization()
  .then(() => {
    console.log('Script finalizado');
    process.exit(0);
  })
  .catch(error => {
    console.error('Error en el script:', error);
    process.exit(1);
  });