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
      RETURNING *
    `;
    
    const result = await pool.query(query);
    
    if (result.rows.length > 0) {
      console.log('Organización actualizada con pdfConfig:', result.rows[0]);
    } else {
      console.log('No se encontró la organización con ID 1');
    }
    
    console.log('Proceso completado');
  } catch (error) {
    console.error('Error en la actualización:', error);
  } finally {
    // Cerrar la conexión
    await pool.end();
  }
}

updateOrganizationPdfConfig();