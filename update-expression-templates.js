import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function updateExpressionTemplates() {
  try {
    console.log('Updating expression templates...');
    
    // Update brick-type parameter with "de {value}" expression
    const { data: brickUpdate, error: brickError } = await supabase
      .from('task_template_parameters')
      .update({
        expression_template: 'de {value}'
      })
      .eq('parameter_id', '7dec6b3b-1689-4b28-8c7a-8629bc6590ee');
    
    if (brickError) {
      console.error('Error updating brick-type parameter:', brickError);
    } else {
      console.log('Brick-type parameter updated successfully');
    }
    
    // Update mortar_type parameter with "{value}" expression  
    const { data: mortarUpdate, error: mortarError } = await supabase
      .from('task_template_parameters')
      .update({
        expression_template: '{value}'
      })
      .eq('parameter_id', '9a2551bc-4278-49d0-9507-d2f244232bac');
    
    if (mortarError) {
      console.error('Error updating mortar_type parameter:', mortarError);
    } else {
      console.log('Mortar-type parameter updated successfully');
    }
    
    console.log('Expression templates updated successfully!');
  } catch (error) {
    console.error('Error updating expression templates:', error);
  }
}

updateExpressionTemplates();