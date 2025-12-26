import { supabase } from '@/lib/supabase';

export async function setupProjectMediaBucket() {
  if (!supabase) {
    console.error('Supabase client not initialized');
    return;
  }

  try {
    console.log('Setting up project-media bucket policies...');

    // Verificar si el bucket existe
    const { data: buckets, error: listError } = await supabase.storage.listBuckets();
    
    if (listError) {
      console.error('Error listing buckets:', listError);
      return;
    }

    const projectMediaBucket = buckets?.find(bucket => bucket.name === 'project-media');
    
    if (!projectMediaBucket) {
      console.log('Creating project-media bucket...');
      const { error: createError } = await supabase.storage.createBucket('project-media', {
        public: false,
        allowedMimeTypes: ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'video/mp4', 'video/avi', 'video/mov'],
        fileSizeLimit: 10485760 // 10MB
      });

      if (createError) {
        console.error('Error creating bucket:', createError);
        return;
      }
      console.log('Bucket created successfully');
    }

    console.log('Bucket setup completed');

  } catch (error) {
    console.error('Error setting up bucket:', error);
  }
}

export async function createBucketPolicies() {
  if (!supabase) {
    console.error('Supabase client not initialized');
    return;
  }

  try {
    console.log('Creating storage policies for site-log-files bucket...');

    // Estas políticas se crean desde el panel de Supabase, pero podemos intentar desde aquí
    const policies = [
      {
        name: 'Allow authenticated uploads to project-media',
        sql: `
          CREATE POLICY "Allow authenticated uploads to project-media" ON storage.objects
          FOR INSERT 
          TO authenticated 
          WITH CHECK (bucket_id = 'project-media');
        `
      },
      {
        name: 'Allow authenticated users to view project-media',
        sql: `
          CREATE POLICY "Allow authenticated users to view project-media" ON storage.objects
          FOR SELECT 
          TO authenticated 
          USING (bucket_id = 'project-media');
        `
      },
      {
        name: 'Allow authenticated users to delete their project-media',
        sql: `
          CREATE POLICY "Allow authenticated users to delete their project-media" ON storage.objects
          FOR DELETE 
          TO authenticated 
          USING (bucket_id = 'project-media');
        `
      }
    ];

    for (const policy of policies) {
      try {
        const { error } = await supabase.rpc('sql', { query: policy.sql });
        if (error) {
          console.log('Policy might already exist or need manual creation:', policy.name);
        } else {
          console.log('Policy created:', policy.name);
        }
      } catch (err) {
        console.log('Policy creation handled by system:', policy.name);
      }
    }

  } catch (error) {
    console.error('Error creating policies:', error);
  }
}