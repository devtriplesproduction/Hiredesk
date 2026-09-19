"use client";
import React from "react";

export function PrintButton() {
  return (
    <button
      onClick={() => window.print()}
      className="bg-[var(--btn-primary-bg)] hover:opacity-90 text-[var(--btn-primary-text)] font-bold py-3 px-8 rounded-lg shadow"
    >
      Print / Save PDF
    </button>
  );
}
