import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.VITE_SUPABASE_URL
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('Missing Supabase environment variables')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseAnonKey)

const sqlFunction = `
CREATE OR REPLACE FUNCTION public.archub_get_user()
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    current_user_id uuid;
    result json;
BEGIN
    -- Obtener el ID del usuario autenticado
    SELECT auth.uid() INTO current_user_id;
    
    IF current_user_id IS NULL THEN
        RAISE EXCEPTION 'User not authenticated';
    END IF;
    
    -- Construir el JSON resultado con todas las organizaciones
    SELECT json_build_object(
        'user', json_build_object(
            'id', u.id,
            'auth_id', u.auth_id,
            'email', u.email,
            'full_name', u.full_name,
            'avatar_url', u.avatar_url,
            'avatar_source', u.avatar_source,
            'created_at', u.created_at
        ),
        'user_data', CASE 
            WHEN ud.id IS NOT NULL THEN 
                json_build_object(
                    'id', ud.id,
                    'user_id', ud.user_id,
                    'first_name', ud.first_name,
                    'last_name', ud.last_name,
                    'display_name', CONCAT(ud.first_name, ' ', ud.last_name),
                    'country', ud.country,
                    'birthdate', ud.birthdate,
                    'created_at', ud.created_at
                )
            ELSE NULL
        END,
        'preferences', CASE 
            WHEN up.id IS NOT NULL THEN 
                json_build_object(
                    'id', up.id,
                    'user_id', up.user_id,
                    'theme', up.theme,
                    'sidebar_docked', up.sidebar_docked,
                    'last_organization_id', up.last_organization_id,
                    'last_project_id', up.last_project_id,
                    'last_budget_id', up.last_budget_id,
                    'onboarding_completed', up.onboarding_completed,
                    'created_at', up.created_at
                )
            ELSE NULL
        END,
        'organization', CASE 
            WHEN current_org.id IS NOT NULL THEN 
                json_build_object(
                    'id', current_org.id,
                    'name', current_org.name,
                    'is_active', current_org.is_active,
                    'is_system', current_org.is_system,
                    'created_by', current_org.created_by,
                    'created_at', current_org.created_at,
                    'updated_at', current_org.updated_at
                )
            ELSE NULL
        END,
        'organizations', (
            SELECT json_agg(
                json_build_object(
                    'id', o.id,
                    'name', o.name,
                    'created_at', o.created_at,
                    'is_active', o.is_active,
                    'is_system', o.is_system,
                    'plan', CASE 
                        WHEN p.id IS NOT NULL THEN 
                            json_build_object(
                                'id', p.id,
                                'name', p.name,
                                'features', p.features,
                                'price', p.price
                            )
                        ELSE NULL
                    END
                )
            )
            FROM public.organization_members om
            JOIN public.organizations o ON o.id = om.organization_id
            LEFT JOIN public.plans p ON p.id = o.plan_id
            WHERE om.user_id = u.id
        ),
        'organization_preferences', CASE 
            WHEN org_prefs.organization_id IS NOT NULL THEN 
                json_build_object(
                    'organization_id', org_prefs.organization_id,
                    'default_currency_id', org_prefs.default_currency_id,
                    'default_wallet_id', org_prefs.default_wallet_id,
                    'pdf_template', org_prefs.pdf_template,
                    'created_at', org_prefs.created_at
                )
            ELSE NULL
        END,
        'role', CASE 
            WHEN member_role.id IS NOT NULL THEN 
                json_build_object(
                    'id', member_role.id,
                    'name', member_role.name,
                    'permissions', member_role.permissions
                )
            ELSE NULL
        END,
        'plan', CASE 
            WHEN current_plan.id IS NOT NULL THEN 
                json_build_object(
                    'id', current_plan.id,
                    'name', current_plan.name,
                    'features', current_plan.features,
                    'max_users', current_plan.max_users,
                    'price', current_plan.price
                )
            ELSE NULL
        END
    ) INTO result
    FROM public.users u
    LEFT JOIN public.user_data ud ON ud.user_id = u.id
    LEFT JOIN public.user_preferences up ON up.user_id = u.id
    LEFT JOIN public.organizations current_org ON current_org.id = up.last_organization_id
    LEFT JOIN public.organization_preferences org_prefs ON org_prefs.organization_id = up.last_organization_id
    LEFT JOIN public.organization_members om_current ON om_current.user_id = u.id AND om_current.organization_id = up.last_organization_id
    LEFT JOIN public.roles member_role ON member_role.id = om_current.role_id
    LEFT JOIN public.plans current_plan ON current_plan.id = current_org.plan_id
    WHERE u.auth_id = current_user_id;
    
    RETURN result;
END;
$$;
`

async function updateFunction() {
  try {
    const { data, error } = await supabase.rpc('exec', { query: sqlFunction })
    
    if (error) {
      console.error('Error updating function:', error)
      return
    }
    
    console.log('Function updated successfully')
    
    // Test the function
    const { data: testData, error: testError } = await supabase.rpc('archub_get_user')
    
    if (testError) {
      console.error('Error testing function:', testError)
      return
    }
    
    console.log('Organizations count:', testData?.organizations?.length || 0)
    
  } catch (err) {
    console.error('Script error:', err)
  }
}

updateFunction()
