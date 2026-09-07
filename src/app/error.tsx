"use client";

import { useEffect } from "react";
import { Btn } from "@/components/ui";

export default function ErrorBoundary({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error("Global Error Caught:", error);
  }, [error]);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-zinc-950 p-6 text-center">
      <div className="w-16 h-16 rounded-full bg-red-500/10 flex items-center justify-center mb-6 border border-red-500/20">
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-red-500">
          <circle cx="12" cy="12" r="10"/>
          <line x1="12" y1="8" x2="12" y2="12"/>
          <line x1="12" y1="16" x2="12.01" y2="16"/>
        </svg>
      </div>
      <h2 className="text-xl font-bold text-white mb-2">Something went wrong</h2>
      <p className="text-sm text-zinc-400 max-w-md mb-8">
        {error.message || "An unexpected error occurred while loading this page."}
      </p>
      <div className="flex gap-4">
        <Btn
          onClick={() => window.location.reload()}
          className="bg-white text-black px-6 py-2.5 rounded-xl text-sm font-bold hover:bg-zinc-200 transition-colors"
        >
          Hard Reload
        </Btn>
        <Btn
          onClick={() => reset()}
          className="bg-zinc-900 border border-white/10 text-white px-6 py-2.5 rounded-xl text-sm font-bold hover:bg-zinc-800 transition-colors"
        >
          Try Again
        </Btn>
      </div>
    </div>
  );
}
