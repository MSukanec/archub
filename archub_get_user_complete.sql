CREATE OR REPLACE FUNCTION archub_get_user()
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    result json;
    current_user_id uuid;
BEGIN
    -- Get the current user ID from auth context
    current_user_id := auth.uid();
    
    IF current_user_id IS NULL THEN
        RAISE EXCEPTION 'User not authenticated';
    END IF;

    SELECT json_build_object(
        'user', json_build_object(
            'id', u.id,
            'auth_id', u.auth_id,
            'email', u.email,
            'first_name', u.first_name,
            'last_name', u.last_name,
            'full_name', u.full_name,
            'avatar_url', u.avatar_url,
            'avatar_source', u.avatar_source,
            'role_id', u.role_id,
            'created_at', u.created_at
        ),
        'user_data', CASE 
            WHEN ud.id IS NOT NULL THEN json_build_object(
                'id', ud.id,
                'user_id', ud.user_id,
                'country', ud.country,
                'birthdate', ud.birthdate,
                'created_at', ud.created_at,
                'updated_at', ud.updated_at
            )
            ELSE NULL
        END,
        'preferences', CASE 
            WHEN up.id IS NOT NULL THEN json_build_object(
                'id', up.id,
                'user_id', up.user_id,
                'last_project_id', up.last_project_id,
                'last_organization_id', up.last_organization_id,
                'last_budget_id', up.last_budget_id,
                'theme', up.theme,
                'sidebar_docked', up.sidebar_docked,
                'onboarding_completed', up.onboarding_completed,
                'created_at', up.created_at
            )
            ELSE NULL
        END,
        'organization', CASE 
            WHEN o.id IS NOT NULL THEN json_build_object(
                'id', o.id,
                'name', o.name,
                'is_active', o.is_active,
                'is_system', o.is_system,
                'created_by', o.created_by,
                'created_at', o.created_at,
                'updated_at', o.updated_at
            )
            ELSE NULL
        END,
        'organization_preferences', CASE 
            WHEN op.id IS NOT NULL THEN json_build_object(
                'id', op.id,
                'organization_id', op.organization_id,
                'default_currency', op.default_currency,
                'default_wallet', op.default_wallet,
                'pdf_template', op.pdf_template,
                'created_at', op.created_at,
                'updated_at', op.updated_at
            )
            ELSE NULL
        END,
        'role', CASE 
            WHEN r.id IS NOT NULL THEN json_build_object(
                'id', r.id,
                'name', r.name,
                'permissions', r.permissions
            )
            ELSE NULL
        END,
        'plan', CASE 
            WHEN p.id IS NOT NULL THEN json_build_object(
                'id', p.id,
                'name', p.name,
                'features', p.features,
                'max_users', p.max_users,
                'price', p.price
            )
            ELSE NULL
        END
    ) INTO result
    FROM users u
    LEFT JOIN user_data ud ON u.id = ud.user_id
    LEFT JOIN user_preferences up ON u.id = up.user_id
    LEFT JOIN organizations o ON up.last_organization_id = o.id
    LEFT JOIN organization_preferences op ON o.id = op.organization_id
    LEFT JOIN roles r ON u.role_id = r.id
    LEFT JOIN plans p ON o.plan_id = p.id
    WHERE u.auth_id = current_user_id;

    RETURN result;
END;
$$;