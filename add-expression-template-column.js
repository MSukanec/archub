import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function addExpressionTemplateColumn() {
  try {
    console.log('Adding expression_template column to task_template_parameters...');
    
    // Add the column using SQL
    const { data, error } = await supabase.rpc('exec_sql', {
      sql: `
        ALTER TABLE task_template_parameters 
        ADD COLUMN IF NOT EXISTS expression_template TEXT;
      `
    });
    
    if (error) {
      console.error('Error adding column:', error);
    } else {
      console.log('Column added successfully');
      
      // Now update the specific parameters
      console.log('Updating brick-type parameter...');
      const { error: brickError } = await supabase
        .from('task_template_parameters')
        .update({
          expression_template: 'de {value}'
        })
        .eq('parameter_id', '7dec6b3b-1689-4b28-8c7a-8629bc6590ee');
      
      if (brickError) {
        console.error('Error updating brick parameter:', brickError);
      } else {
        console.log('Brick parameter updated');
      }
      
      console.log('Updating mortar-type parameter...');
      const { error: mortarError } = await supabase
        .from('task_template_parameters')
        .update({
          expression_template: '{value}'
        })
        .eq('parameter_id', '9a2551bc-4278-49d0-9507-d2f244232bac');
      
      if (mortarError) {
        console.error('Error updating mortar parameter:', mortarError);
      } else {
        console.log('Mortar parameter updated');
      }
    }
    
  } catch (error) {
    console.error('Error:', error);
  }
}

addExpressionTemplateColumn();