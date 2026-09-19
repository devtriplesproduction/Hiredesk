"use client";
import React from "react";

export function PrintButton() {
  return (
    <button
      onClick={() => window.print()}
      className="bg-blue-600 hover:bg-blue-700 text-text font-bold py-3 px-8 rounded-lg shadow"
    >
      Print / Save PDF
    </button>
  );
}
