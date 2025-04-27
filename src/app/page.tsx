'use client';

import React from 'react';

import { LiveCanvasView } from '@/components/app/LiveCanvasView';
import { LiveAPIProvider } from '@/contexts/LiveAPIContext';

const apiKey = process.env.NEXT_PUBLIC_GCP_API_KEY;
const host = 'generativelanguage.googleapis.com';
const uri = `wss://${host}/ws/google.ai.generativelanguage.v1alpha.GenerativeService.BidiGenerateContent`;

export default function Page() {
  if (!apiKey) {
    return (
      <div className='flex h-screen items-center justify-center'>
        <p className='text-red-500'>Error: NEXT_PUBLIC_GCP_API_KEY environment variable is not set.</p>
      </div>
    );
  }

  return (
    <LiveAPIProvider url={uri} apiKey={apiKey}>
      <LiveCanvasView />
    </LiveAPIProvider>
  );
}
