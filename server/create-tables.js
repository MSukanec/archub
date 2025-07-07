import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase credentials');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function createTables() {
  try {
    console.log('Checking existing table structure...');
    
    // Try to select from task_templates to see what columns exist
    const { data: templatesTest, error: templatesTestError } = await supabase
      .from('task_templates')
      .select('*')
      .limit(1);
    
    console.log('task_templates structure test:', { templatesTest, templatesTestError });

    // Try to select from task_template_parameters to see what columns exist
    const { data: parametersTest, error: parametersTestError } = await supabase
      .from('task_template_parameters')
      .select('*')
      .limit(1);
    
    console.log('task_template_parameters structure test:', { parametersTest, parametersTestError });

    // Try using RPC to add missing columns
    console.log('Attempting to add missing columns...');
    
    const alterTaskTemplatesSQL = `
      DO $$
      BEGIN
        -- Add columns to task_templates if they don't exist
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='task_templates' AND column_name='code_prefix') THEN
          ALTER TABLE task_templates ADD COLUMN code_prefix TEXT;
        END IF;
        
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='task_templates' AND column_name='name') THEN
          ALTER TABLE task_templates ADD COLUMN name TEXT;
        END IF;
        
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='task_templates' AND column_name='name_template') THEN
          ALTER TABLE task_templates ADD COLUMN name_template TEXT;
        END IF;
        
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='task_templates' AND column_name='category_id') THEN
          ALTER TABLE task_templates ADD COLUMN category_id UUID;
        END IF;
      END$$;
    `;

    const { data: alterResult, error: alterError } = await supabase
      .rpc('exec_sql', { sql: alterTaskTemplatesSQL });

    console.log('Alter table result:', { alterResult, alterError });

    // Test template creation after adding columns
    console.log('Testing template creation after adding columns...');
    const { data: testTemplate, error: testError } = await supabase
      .from('task_templates')
      .insert({
        code_prefix: 'TEST',
        name: 'Test Template',
        name_template: 'Test {{material}} {{dimension}}',
        category_id: '1'
      })
      .select()
      .single();

    if (testError) {
      console.log('Template creation error:', testError);
    } else {
      console.log('Template created successfully:', testTemplate);
      
      // Clean up test template
      await supabase
        .from('task_templates')
        .delete()
        .eq('id', testTemplate.id);
    }

  } catch (error) {
    console.error('Error:', error);
  }
}

createTables();