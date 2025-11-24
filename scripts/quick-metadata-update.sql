-- SOLUCIÓN RÁPIDA: Actualizar metadata sin mover imágenes
-- Las imágenes ya existen en project-image bucket
-- Simplemente actualizar la metadata de project_data para que las encuentre

UPDATE project_data SET 
  image_bucket = 'project-image',
  image_path = organization_id || '/' || project_id || '/' || 
               CASE 
                 WHEN project_image_url LIKE '%.webp%' THEN 'hero.webp'
                 WHEN project_image_url LIKE '%.png%' THEN 'hero.png'
                 WHEN project_image_url LIKE '%.jpeg%' THEN 'hero.jpeg'
                 ELSE 'hero.jpg'
               END
WHERE project_id IN (
  '0e008062-40c2-4a73-9953-9aec0010eb22',
  '39728f5a-9a9a-44dd-8777-219e7a11cc92',
  '160942fd-dcf3-4960-8186-a1d9af1f063c',
  '6f83ab40-7a36-42ec-a805-9c3fd37bf05f',
  'e0c72f54-1e1a-40a2-8a2b-ddf2b12d26ea',
  '008a8d26-f04f-4bf3-aa93-073c8cf7d53e',
  '742ca6af-84a3-4214-80f6-be75da132366',
  'b50deb86-069c-4192-92ce-84cddc20d77a',
  'e468b25d-69e7-455a-8f48-b0c3e008d1b3',
  '39179548-9aaa-4c66-9fe1-e95c1b6242d4',
  'e63e0c9b-899f-4004-9e94-5380bac0cfee',
  'e5ea560d-1c04-477d-9faa-89273dd340e6',
  '64a27ae9-b575-49a7-b3ce-f0ce0c5de30e',
  '83be79f4-248c-4e5c-bf58-c7d1a7b3c636',
  '6cbb7e67-8a05-400f-982e-12b182d7dcd0',
  '7a10dea6-4906-4875-88bf-ddd6db3121ab',
  '3c52e0a3-2e9b-46ec-ad9d-b73f4a6c62d4',
  'fa9988ba-a8d3-450b-994e-fae88b3f5478',
  '524bb958-5be3-41a1-83b9-ef78fda773f1',
  'a11cc20e-6bc4-40d5-a2bd-e32a57a7d527',
  'da296e5a-2c04-44dd-8514-5238dfd407c7',
  'a65a1855-0052-471f-9581-e80812d9573c',
  '5fd4cc23-624e-4787-94fc-ae647edc2344',
  '71a9f35f-ffcc-485c-86dc-851a55bffc9a',
  'fc102fc0-97dc-4382-9c11-33de0188aee7'
)
AND project_image_url IS NOT NULL;

-- Verificar
SELECT COUNT(*) as updated FROM project_data 
WHERE image_bucket = 'project-image' 
  AND image_path IS NOT NULL;
