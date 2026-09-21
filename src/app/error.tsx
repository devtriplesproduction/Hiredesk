"use client";

import { useEffect } from "react";
import { Btn } from "@/components/ui";

export default function ErrorBoundary({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error("Global Error Caught:", error);
  }, [error]);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-[var(--card-bg)] p-6 text-center">
      <div className="w-16 h-16 rounded-full bg-red-500/10 flex items-center justify-center mb-6 border border-red-500/20">
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-red-500">
          <circle cx="12" cy="12" r="10"/>
          <line x1="12" y1="8" x2="12" y2="12"/>
          <line x1="12" y1="16" x2="12.01" y2="16"/>
        </svg>
      </div>
      <h2 className="text-xl font-bold text-text mb-2">Something went wrong</h2>
      <p className="text-sm text-text-2 max-w-md mb-8">
        {error.message || "An unexpected error occurred while loading this page."}
      </p>
      <div className="flex gap-4">
        <Btn
          onClick={() => window.location.reload()}
          className="bg-accent text-bg2 px-6 py-2.5 rounded-xl text-sm font-bold hover:bg-zinc-200 transition-colors"
        >
          Hard Reload
        </Btn>
        <Btn
          onClick={() => reset()}
          className="bg-[var(--card-bg)] border border-border text-text px-6 py-2.5 rounded-xl text-sm font-bold hover:bg-[var(--table-row-hover)] transition-colors"
        >
          Try Again
        </Btn>
      </div>
    </div>
  );
}
