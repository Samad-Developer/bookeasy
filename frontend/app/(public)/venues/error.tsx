'use client'; // error pages must be Client Components

import { useEffect } from 'react';
import { Button } from '@/components/ui/button';

// Shown when something throws while loading /venues or /venues/[id] (for example the API is down).
// Newer Next.js versions call the retry function "retry"; older ones called it "reset". We accept both.
export default function VenuesError({
  error,
  retry,
  reset,
}: {
  error: unknown;
  retry?: () => void;
  reset?: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  const tryAgain = retry ?? reset;

  return (
    <div role="alert" className="max-w-md space-y-3 py-8">
      <h1 className="text-2xl font-semibold tracking-tight">Venues could not be loaded</h1>
      <p className="text-muted-foreground">Something went wrong on our side. Please try again in a moment.</p>
      <Button variant="outline" onClick={() => (tryAgain ? tryAgain() : window.location.reload())}>
        Try again
      </Button>
    </div>
  );
}