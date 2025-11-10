import { supabase } from '@/lib/supabase';

export async function setupProjectMediaBucket() {
  if (!supabase) {
    return;
  }

  try {

    // Verificar si el bucket existe
    const { data: buckets, error: listError } = await supabase.storage.listBuckets();
    
    if (listError) {
      return;
    }

    const projectMediaBucket = buckets?.find(bucket => bucket.name === 'project-media');
    
    if (!projectMediaBucket) {
      const { error: createError } = await supabase.storage.createBucket('project-media', {
        public: false,
        allowedMimeTypes: ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'video/mp4', 'video/avi', 'video/mov'],
        fileSizeLimit: 10485760 // 10MB
      });

      if (createError) {
        return;
      }
    }


  } catch (error) {
  }
}

export async function createBucketPolicies() {
  if (!supabase) {
    return;
  }

  try {

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
        } else {
        }
      } catch (err) {
      }
    }

  } catch (error) {
  }
}