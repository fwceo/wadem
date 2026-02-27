// Creates the Firestore vector index for menu_items collection programmatically.
// Uses googleapis (same as sheets.ts) to call the Firestore REST API.
// Call once: POST /api/embed/create-index

import { NextResponse } from 'next/server';
import { google } from 'googleapis';

export async function POST() {
  try {
    const credsBase64 = process.env.GOOGLE_SHEETS_CREDENTIALS;
    if (!credsBase64) {
      return NextResponse.json({ error: 'GOOGLE_SHEETS_CREDENTIALS not set' }, { status: 500 });
    }

    const creds = JSON.parse(Buffer.from(credsBase64, 'base64').toString('utf-8'));
    const projectId = creds.project_id;

    const auth = new google.auth.GoogleAuth({
      credentials: creds,
      scopes: ['https://www.googleapis.com/auth/cloud-platform'],
    });

    const accessTokenResponse = await auth.getAccessToken();
    const accessToken = accessTokenResponse;

    // Create the composite index with vector field via Firestore REST API
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
        return NextResponse.json({
          success: true,
          message: 'Vector index already exists!',
        });
      }
      return NextResponse.json({
        error: 'Failed to create index',
        details: data.error,
      }, { status: res.status });
    }

    return NextResponse.json({
      success: true,
      message: 'Vector index creation started! It may take a few minutes to build.',
      operation: data,
    });
  } catch (err) {
    return NextResponse.json({
      error: 'Failed to create index',
      details: String(err),
    }, { status: 500 });
  }
}
