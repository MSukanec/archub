import { pool } from '../server/db.ts';

async function updateOrganizationPdfConfig() {
  try {
    console.log('Actualizando configuración PDF de la organización...');
    
    // SQL query para actualizar directamente
    const query = `
      UPDATE organizations 
      SET 
        pdf_config = '{"primaryColor":"#92c900","secondaryColor":"#707070","logoPosition":"left","showFooter":true,"showHeader":true}'
      WHERE id = 1
    `;
    
    const result = await pool.query(query);
    console.log('Organización actualizada:', result);
    console.log('Proceso completado');
  } catch (error) {
    console.error('Error en la actualización:', error);
  } finally {
    // Cerrar la conexión
    await pool.end();
  }
}

updateOrganizationPdfConfig();