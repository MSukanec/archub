import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function addExpressionTemplateColumn() {
  try {
    console.log('Checking if expression_template column exists...');
    
    // First, let's check the current structure
    const { data: existingData, error: checkError } = await supabase
      .from('task_template_parameters')
      .select('*')
      .limit(1);
    
    if (checkError) {
      console.error('Error checking table:', checkError);
      return;
    }
    
    console.log('Current table structure:', existingData?.[0] ? Object.keys(existingData[0]) : 'No data');
    
    // Try to update manually via direct update
    console.log('Updating parameters directly...');
    
    const { error: updateError1 } = await supabase
      .from('task_template_parameters')
      .update({
        expression_template: 'de {value}'
      })
      .eq('parameter_id', '7dec6b3b-1689-4b28-8c7a-8629bc6590ee');
    
    if (updateError1) {
      console.error('Error updating first parameter:', updateError1);
    } else {
      console.log('First parameter updated successfully');
    }
    
    const { error: updateError2 } = await supabase
      .from('task_template_parameters')
      .update({
        expression_template: '{value}'
      })
      .eq('parameter_id', '9a2551bc-4278-49d0-9507-d2f244232bac');
      
    if (updateError2) {
      console.error('Error updating second parameter:', updateError2);
    } else {
      console.log('Second parameter updated successfully');
    }
    
  } catch (error) {
    console.error('Error:', error);
  }
}

addExpressionTemplateColumn();