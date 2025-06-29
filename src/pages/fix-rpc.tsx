import React from 'react';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/button';

export function FixRpcPage() {
  const updateRpcFunction = async () => {
    if (!supabase) {
      console.error('Supabase not initialized');
      return;
    }

    const sqlFunction = `
      CREATE OR REPLACE FUNCTION create_generated_task(
        input_template_id UUID,
        input_param_values JSONB,
        input_created_by VARCHAR
      )
      RETURNS JSONB
      LANGUAGE plpgsql
      AS $$
      DECLARE
        template_rec RECORD;
        generated_code VARCHAR;
        existing_task_rec RECORD;
        new_task_id UUID;
      BEGIN
        -- Get template information with explicit table alias
        SELECT tt.id, tt.name, tt.description
        INTO template_rec
        FROM task_templates tt
        WHERE tt.id = input_template_id;
        
        IF NOT FOUND THEN
          RAISE EXCEPTION 'Template not found';
        END IF;
        
        -- Generate unique code based on template and parameters
        generated_code := template_rec.name || '_' || 
          SUBSTRING(MD5(input_param_values::TEXT) FROM 1 FOR 8);
        
        -- Check if task with same code already exists with explicit table alias
        SELECT gt.id, gt.code, gt.description
        INTO existing_task_rec
        FROM generated_tasks gt
        WHERE gt.code = generated_code;
        
        IF FOUND THEN
          -- Return existing task
          RETURN jsonb_build_object(
            'existing_task', jsonb_build_object(
              'id', existing_task_rec.id,
              'code', existing_task_rec.code,
              'description', existing_task_rec.description
            )
          );
        END IF;
        
        -- Create new generated task
        new_task_id := gen_random_uuid();
        
        INSERT INTO generated_tasks (
          id,
          code,
          template_id,
          param_values,
          description,
          created_by,
          is_public,
          created_at
        ) VALUES (
          new_task_id,
          generated_code,
          input_template_id,
          input_param_values,
          template_rec.description || ' - Generada',
          input_created_by,
          true,
          NOW()
        );
        
        -- Return new task
        RETURN jsonb_build_object(
          'new_task', jsonb_build_object(
            'id', new_task_id,
            'code', generated_code,
            'description', template_rec.description || ' - Generada'
          )
        );
      END;
      $$;
    `;

    try {
      const { data, error } = await supabase.rpc('sql', { query: sqlFunction });
      
      if (error) {
        console.error('Error updating RPC function:', error);
        alert('Error updating function: ' + error.message);
        return;
      }
      
      console.log('RPC function updated successfully');
      alert('RPC function updated successfully!');
    } catch (error) {
      console.error('Error executing SQL:', error);
      alert('Error: ' + (error as Error).message);
    }
  };

  return (
    <div className="p-8">
      <h1>Fix RPC Function</h1>
      <Button onClick={updateRpcFunction}>
        Update create_generated_task Function
      </Button>
    </div>
  );
}