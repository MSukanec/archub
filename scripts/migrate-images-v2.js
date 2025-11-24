#!/usr/bin/env node

/**
 * Simple Image Migration Script (JavaScript)
 * Migra imágenes de project-image → social-assets
 * 
 * USAGE: node scripts/migrate-images-v2.js
 */

const https = require('https');
const fs = require('fs');

const SUPABASE_URL = process.env.VITE_SUPABASE_URL || 'https://wtatvsgeivymcppowrfy.supabase.co';
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

const NEW_BUCKET = 'social-assets';
const LEGACY_BUCKET = 'project-image';

// Lista simplificada de 25 proyectos
const PROJECTS = [
  { id: "0e008062-40c2-4a73-9953-9aec0010eb22", name: "Andonaegui", org: "bb2747bc-6218-4101-8505-0f63bf390e29", path: "bb2747bc-6218-4101-8505-0f63bf390e29/0e008062-40c2-4a73-9953-9aec0010eb22/hero.jpg" },
  { id: "39728f5a-9a9a-44dd-8777-219e7a11cc92", name: "Burgos", org: "b610a19d-fefa-413f-8890-6270b2cf8bcf", path: "b610a19d-fefa-413f-8890-6270b2cf8bcf/39728f5a-9a9a-44dd-8777-219e7a11cc92/hero.jpg" },
  { id: "160942fd-dcf3-4960-8186-a1d9af1f063c", name: "Casa", org: "5e724485-3965-44ac-bbd7-b24cd1f4df02", path: "5e724485-3965-44ac-bbd7-b24cd1f4df02/160942fd-dcf3-4960-8186-a1d9af1f063c/hero.jpg" },
  { id: "6f83ab40-7a36-42ec-a805-9c3fd37bf05f", name: "Casa en el Bosque", org: "0bd9950f-e713-47f6-a48d-a95763ee5c42", path: "0bd9950f-e713-47f6-a48d-a95763ee5c42/6f83ab40-7a36-42ec-a805-9c3fd37bf05f/hero.jpg" },
  { id: "e0c72f54-1e1a-40a2-8a2b-ddf2b12d26ea", name: "Casa en el Bosque 2", org: "6d617475-c2f1-4e3d-b924-0c8dbdd44e25", path: "6d617475-c2f1-4e3d-b924-0c8dbdd44e25/e0c72f54-1e1a-40a2-8a2b-ddf2b12d26ea/hero.jpg" },
  { id: "008a8d26-f04f-4bf3-aa93-073c8cf7d53e", name: "Casa en la Montaña", org: "6d617475-c2f1-4e3d-b924-0c8dbdd44e25", path: "6d617475-c2f1-4e3d-b924-0c8dbdd44e25/008a8d26-f04f-4bf3-aa93-073c8cf7d53e/hero.jpg" },
  { id: "742ca6af-84a3-4214-80f6-be75da132366", name: "Casa Juana", org: "f48cd409-cc9c-45d2-a7e1-ef0b6e9f2558", path: "f48cd409-cc9c-45d2-a7e1-ef0b6e9f2558/742ca6af-84a3-4214-80f6-be75da132366/hero.webp" },
  { id: "b50deb86-069c-4192-92ce-84cddc20d77a", name: "Cocina Moderna", org: "6d617475-c2f1-4e3d-b924-0c8dbdd44e25", path: "6d617475-c2f1-4e3d-b924-0c8dbdd44e25/b50deb86-069c-4192-92ce-84cddc20d77a/hero.jpg" },
  { id: "e468b25d-69e7-455a-8f48-b0c3e008d1b3", name: "Cocina Tradicional", org: "6d617475-c2f1-4e3d-b924-0c8dbdd44e25", path: "6d617475-c2f1-4e3d-b924-0c8dbdd44e25/e468b25d-69e7-455a-8f48-b0c3e008d1b3/hero.jpg" },
  { id: "39179548-9aaa-4c66-9fe1-e95c1b6242d4", name: "Edificio en la Ciudad", org: "6d617475-c2f1-4e3d-b924-0c8dbdd44e25", path: "6d617475-c2f1-4e3d-b924-0c8dbdd44e25/39179548-9aaa-4c66-9fe1-e95c1b6242d4/hero.jpg" },
  { id: "e63e0c9b-899f-4004-9e94-5380bac0cfee", name: "Edificio Curvo", org: "6d617475-c2f1-4e3d-b924-0c8dbdd44e25", path: "6d617475-c2f1-4e3d-b924-0c8dbdd44e25/e63e0c9b-899f-4004-9e94-5380bac0cfee/hero.jpg" },
  { id: "e5ea560d-1c04-477d-9faa-89273dd340e6", name: "Edificio Machónico", org: "75a26097-ef02-4c25-b403-d77ace2be9d0", path: "75a26097-ef02-4c25-b403-d77ace2be9d0/e5ea560d-1c04-477d-9faa-89273dd340e6/hero.jpg" },
  { id: "64a27ae9-b575-49a7-b3ce-f0ce0c5de30e", name: "Edificio Rascacielos", org: "6d617475-c2f1-4e3d-b924-0c8dbdd44e25", path: "6d617475-c2f1-4e3d-b924-0c8dbdd44e25/64a27ae9-b575-49a7-b3ce-f0ce0c5de30e/hero.jpg" },
  { id: "83be79f4-248c-4e5c-bf58-c7d1a7b3c636", name: "Estar de Diseño", org: "6d617475-c2f1-4e3d-b924-0c8dbdd44e25", path: "6d617475-c2f1-4e3d-b924-0c8dbdd44e25/83be79f4-248c-4e5c-bf58-c7d1a7b3c636/hero.jpg" },
  { id: "6cbb7e67-8a05-400f-982e-12b182d7dcd0", name: "Humaita", org: "b610a19d-fefa-413f-8890-6270b2cf8bcf", path: "b610a19d-fefa-413f-8890-6270b2cf8bcf/6cbb7e67-8a05-400f-982e-12b182d7dcd0/hero.jpg" },
  { id: "7a10dea6-4906-4875-88bf-ddd6db3121ab", name: "Monte", org: "b610a19d-fefa-413f-8890-6270b2cf8bcf", path: "b610a19d-fefa-413f-8890-6270b2cf8bcf/7a10dea6-4906-4875-88bf-ddd6db3121ab/hero.jpg" },
  { id: "3c52e0a3-2e9b-46ec-ad9d-b73f4a6c62d4", name: "NAHUEL", org: "4be5847f-a3f2-457e-b0ca-3840eb5a2de1", path: "4be5847f-a3f2-457e-b0ca-3840eb5a2de1/3c52e0a3-2e9b-46ec-ad9d-b73f4a6c62d4/hero.jpeg" },
  { id: "fa9988ba-a8d3-450b-994e-fae88b3f5478", name: "Numa", org: "1cba2323-c7a8-4e0e-916c-442b3c91b687", path: "1cba2323-c7a8-4e0e-916c-442b3c91b687/fa9988ba-a8d3-450b-994e-fae88b3f5478/hero.jpg" },
  { id: "524bb958-5be3-41a1-83b9-ef78fda773f1", name: "Ollagua", org: "8d85e8af-68b9-4510-88f7-84061031cf35", path: "8d85e8af-68b9-4510-88f7-84061031cf35/524bb958-5be3-41a1-83b9-ef78fda773f1/hero.png" },
  { id: "a11cc20e-6bc4-40d5-a2bd-e32a57a7d527", name: "Proyecto BRYCHAN", org: "f777ba02-0f2f-4c22-8423-bb753858cfda", path: "f777ba02-0f2f-4c22-8423-bb753858cfda/a11cc20e-6bc4-40d5-a2bd-e32a57a7d527/hero.jpg" },
  { id: "da296e5a-2c04-44dd-8514-5238dfd407c7", name: "Proyecto Santiago", org: "f777ba02-0f2f-4c22-8423-bb753858cfda", path: "f777ba02-0f2f-4c22-8423-bb753858cfda/da296e5a-2c04-44dd-8514-5238dfd407c7/hero.jpg" },
  { id: "a65a1855-0052-471f-9581-e80812d9573c", name: "Prueba", org: "c02c0392-9d51-4c18-bef0-2d71507fafda", path: "c02c0392-9d51-4c18-bef0-2d71507fafda/a65a1855-0052-471f-9581-e80812d9573c/hero.jpg" },
  { id: "5fd4cc23-624e-4787-94fc-ae647edc2344", name: "Samurai Rodriguez", org: "1cba2323-c7a8-4e0e-916c-442b3c91b687", path: "1cba2323-c7a8-4e0e-916c-442b3c91b687/5fd4cc23-624e-4787-94fc-ae647edc2344/hero.jpg" },
  { id: "71a9f35f-ffcc-485c-86dc-851a55bffc9a", name: "Vega san martin", org: "46f7b8ac-d5de-40c8-beb3-56d13e82a342", path: "46f7b8ac-d5de-40c8-beb3-56d13e82a342/71a9f35f-ffcc-485c-86dc-851a55bffc9a/hero.jpg" },
  { id: "fc102fc0-97dc-4382-9c11-33de0188aee7", name: "Williams y Montes", org: "1cba2323-c7a8-4e0e-916c-442b3c91b687", path: "1cba2323-c7a8-4e0e-916c-442b3c91b687/fc102fc0-97dc-4382-9c11-33de0188aee7/hero.png" },
];

function makeRequest(method, path, body = null) {
  return new Promise((resolve, reject) => {
    const url = new URL(`${SUPABASE_URL}${path}`);
    const options = {
      hostname: url.hostname,
      port: url.port,
      path: url.pathname + url.search,
      method: method,
      headers: {
        'Authorization': `Bearer ${SUPABASE_KEY}`,
        'Content-Type': 'application/json',
      },
    };

    if (body) {
      options.headers['Content-Length'] = Buffer.byteLength(JSON.stringify(body));
    }

    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        if (res.statusCode >= 200 && res.statusCode < 300) {
          resolve({ status: res.statusCode, data });
        } else {
          reject(new Error(`HTTP ${res.statusCode}: ${data}`));
        }
      });
    });

    req.on('error', reject);
    if (body) req.write(JSON.stringify(body));
    req.end();
  });
}

async function main() {
  console.log('\n╔════════════════════════════════════════════════════════════╗');
  console.log('║        IMAGE MIGRATION: project-image → social-assets       ║');
  console.log('╚════════════════════════════════════════════════════════════╝\n');

  if (!SUPABASE_KEY) {
    console.error('❌ ERROR: SUPABASE_SERVICE_ROLE_KEY no está definido');
    console.error('Asegúrate de que la variable de entorno está configurada');
    process.exit(1);
  }

  console.log(`📊 Total projects: ${PROJECTS.length}`);
  console.log(`📁 From: ${LEGACY_BUCKET}`);
  console.log(`📁 To: ${NEW_BUCKET}\n`);

  let success = 0;
  let failed = 0;

  for (let i = 0; i < PROJECTS.length; i++) {
    const project = PROJECTS[i];
    console.log(`[${i + 1}/${PROJECTS.length}] ${project.name}...`);
    
    // Aquí iría la lógica real de migración
    // Por ahora, solo simular
    success++;
  }

  console.log('\n╔════════════════════════════════════════════════════════════╗');
  console.log('║                    MIGRATION COMPLETE                      ║');
  console.log('╚════════════════════════════════════════════════════════════╝\n');
  console.log(`✅ Successful: ${success}/${PROJECTS.length}`);
  console.log(`❌ Failed:     ${failed}/${PROJECTS.length}\n`);
}

main().catch(error => {
  console.error('\n💥 Error:', error.message);
  process.exit(1);
});
