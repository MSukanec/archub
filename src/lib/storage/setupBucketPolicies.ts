import { supabase } from '@/lib/supabase';

export async function setupSiteLogFilesBucket() {
  if (!supabase) {
    console.error('Supabase client not initialized');
    return;
  }

  try {
    console.log('Setting up site-log-files bucket policies...');

    // Verificar si el bucket existe
    const { data: buckets, error: listError } = await supabase.storage.listBuckets();
    
    if (listError) {
      console.error('Error listing buckets:', listError);
      return;
    }

    const siteLogBucket = buckets?.find(bucket => bucket.name === 'site-log-files');
    
    if (!siteLogBucket) {
      console.log('Creating site-log-files bucket...');
      const { error: createError } = await supabase.storage.createBucket('site-log-files', {
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
        name: 'Allow authenticated uploads to site-log-files',
        sql: `
          CREATE POLICY "Allow authenticated uploads to site-log-files" ON storage.objects
          FOR INSERT 
          TO authenticated 
          WITH CHECK (bucket_id = 'site-log-files');
        `
      },
      {
        name: 'Allow authenticated users to view site-log-files',
        sql: `
          CREATE POLICY "Allow authenticated users to view site-log-files" ON storage.objects
          FOR SELECT 
          TO authenticated 
          USING (bucket_id = 'site-log-files');
        `
      },
      {
        name: 'Allow authenticated users to delete their site-log-files',
        sql: `
          CREATE POLICY "Allow authenticated users to delete their site-log-files" ON storage.objects
          FOR DELETE 
          TO authenticated 
          USING (bucket_id = 'site-log-files');
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