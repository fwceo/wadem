// Run: node scripts/create-vector-index.mjs
// Creates the Firestore KNN vector index for the menu_items collection.

import { readFileSync } from 'fs';
import { resolve } from 'path';

// Read .env.local manually
const envPath = resolve(process.cwd(), '.env.local');
const envContent = readFileSync(envPath, 'utf-8');
const envVars = {};
for (const line of envContent.split('\n')) {
  const trimmed = line.trim();
  if (!trimmed || trimmed.startsWith('#')) continue;
  const eqIdx = trimmed.indexOf('=');
  if (eqIdx === -1) continue;
  const key = trimmed.slice(0, eqIdx);
  let val = trimmed.slice(eqIdx + 1);
  // Strip surrounding quotes and trailing commas
  val = val.replace(/^["']|["'],?$/g, '').trim();
  envVars[key] = val;
}

const credsBase64 = envVars.GOOGLE_SHEETS_CREDENTIALS;
if (!credsBase64) {
  console.error('❌ GOOGLE_SHEETS_CREDENTIALS not found in .env.local');
  process.exit(1);
}

const creds = JSON.parse(Buffer.from(credsBase64, 'base64').toString('utf-8'));
const projectId = creds.project_id;
console.log(`Project: ${projectId}`);

// Get access token using googleapis
const { google } = await import('googleapis');
const auth = new google.auth.GoogleAuth({
  credentials: creds,
  scopes: ['https://www.googleapis.com/auth/cloud-platform'],
});
const accessToken = await auth.getAccessToken();
console.log('✅ Got access token');

// Create the vector index
const indexBody = {
  queryScope: 'COLLECTION',
  fields: [
    { fieldPath: 'isAvailable', order: 'ASCENDING' },
    { fieldPath: 'isOpen', order: 'ASCENDING' },
    {
      fieldPath: 'vector_embedding',
      vectorConfig: {
        dimension: 1536,
        flat: {},
      },
    },
  ],
};

const url = `https://firestore.googleapis.com/v1/projects/${projectId}/databases/(default)/collectionGroups/menu_items/indexes`;

const res = await fetch(url, {
  method: 'POST',
  headers: {
    Authorization: `Bearer ${accessToken}`,
    'Content-Type': 'application/json',
  },
  body: JSON.stringify(indexBody),
});

const data = await res.json();

if (!res.ok) {
  if (data.error?.message?.includes('already exists')) {
    console.log('✅ Vector index already exists!');
  } else {
    console.error('❌ Failed to create index:', JSON.stringify(data.error, null, 2));
    process.exit(1);
  }
} else {
  console.log('✅ Vector index creation started!');
  console.log('   It may take a few minutes to build.');
  console.log('   Operation:', data.name);
}
