import { pool } from '../server/db.ts';
import { organizationPdfConfigs } from '../shared/schema.ts';

async function createOrganizationPdfConfig() {
  try {
    console.log('Verificando configuración PDF de la organización...');
    
    // Primero verificamos si ya existe una configuración para la organización
    const checkQuery = `
      SELECT * FROM organization_pdf_configs WHERE organization_id = 1
    `;
    
    const existingConfig = await pool.query(checkQuery);
    
    if (existingConfig.rows.length > 0) {
      console.log('Ya existe una configuración PDF para la organización:', existingConfig.rows[0]);
    } else {
      // Creamos la configuración PDF para la organización
      const insertQuery = `
        INSERT INTO organization_pdf_configs (
          organization_id, 
          logo_position, 
          primary_color, 
          secondary_color, 
          show_address, 
          show_phone, 
          show_email, 
          show_website, 
          show_tax_id
        ) VALUES (
          1, 
          'left', 
          '#92c900', 
          '#707070', 
          1, 
          1, 
          1, 
          1, 
          1
        ) RETURNING *
      `;
      
      const result = await pool.query(insertQuery);
      console.log('Configuración PDF creada para la organización:', result.rows[0]);
    }
    
    console.log('Proceso completado');
  } catch (error) {
    console.error('Error en la creación/verificación de la configuración PDF:', error);
  } finally {
    // Cerrar la conexión
    await pool.end();
  }
}

createOrganizationPdfConfig();