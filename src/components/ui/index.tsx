"use client";
import React from "react";
import { clsx } from "clsx";
import type { Candidate } from "@/types";

export function Btn({ variant="ghost", size="md", className, children, ...props }:
  { variant?:"primary"|"ghost"|"danger"|"outline"; size?:"sm"|"md" } & React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button className={clsx(
      "inline-flex items-center gap-1.5 font-semibold uppercase tracking-wide rounded-xl cursor-pointer transition-all duration-150 border",
      size==="sm" ? "text-xs px-3 py-2" : "text-sm px-4 py-2.5",
      variant==="primary" && "bg-white text-black border-white hover:bg-white/85",
      variant==="ghost"   && "bg-[var(--glass-2)] text-[var(--text)] border-[var(--border-2)] hover:bg-[var(--glass-3)] hover:border-[var(--border-3)]",
      variant==="danger"  && "bg-red-500/10 text-red-400 border-red-500/20 hover:bg-red-500/20",
      variant==="outline" && "bg-transparent text-[var(--text-2)] border-[var(--border)] hover:text-[var(--text)] hover:border-[var(--border-2)]",
      className
    )} {...props}>{children}</button>
  );
}

export function Input({ label, className, ...props }: React.InputHTMLAttributes<HTMLInputElement> & { label?:string }) {
  return (
    <div className="flex flex-col gap-1.5">
      {label && <div className="text-xs font-semibold text-[var(--text-3)] uppercase tracking-widest">{label}</div>}
      <input className={clsx(
        "bg-[var(--glass)] border border-[var(--border)] rounded-xl text-[var(--text)] text-sm px-3.5 py-2.5 transition-colors outline-none focus:border-[var(--border-3)] placeholder:text-[var(--text-3)]",
        className
      )} {...props} />
    </div>
  );
}

export function Select({ label, className, children, ...props }: React.SelectHTMLAttributes<HTMLSelectElement> & { label?:string }) {
  return (
    <div className="flex flex-col gap-1.5">
      {label && <div className="text-xs font-semibold text-[var(--text-3)] uppercase tracking-widest">{label}</div>}
      <select className={clsx(
        "bg-[var(--glass-2)] border border-[var(--border)] rounded-xl text-[var(--text)] text-sm px-3.5 py-2.5 transition-colors cursor-pointer appearance-none outline-none focus:border-[var(--border-3)] [&>option]:bg-[#1a1a1a]",
        className
      )} {...props}>{children}</select>
    </div>
  );
}

export function Modal({ open, onClose, children, className }: { open:boolean; onClose:()=>void; children:React.ReactNode; className?:string }) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 bg-black/75 backdrop-blur-md z-50 flex items-center justify-center p-4"
      onClick={e => { if (e.target===e.currentTarget) onClose(); }}>
      <div className={clsx("bg-[var(--bg2)] border border-[var(--border-2)] rounded-2xl p-5 sm:p-7 animate-fade-in w-full max-h-[90vh] overflow-y-auto", className ?? "max-w-md")}>
        {children}
      </div>
    </div>
  );
}

export function ScoreBadge({ score }: { score:number }) {
  return (
    <span className={clsx("font-mono text-xs font-semibold px-2.5 py-1 rounded-lg",
      score>=70?"score-hi":score>=45?"score-mid":"score-lo")}>
      {score}
    </span>
  );
}

export function StatusBadge({ status }: { status:Candidate["status"] }) {
  return (
    <span className={clsx("text-[10px] font-semibold uppercase tracking-wider px-2.5 py-1 rounded-lg", `status-${status}`)}>
      {status}
    </span>
  );
}

export function StatCard({ label, value, delta, deltaUp }: { label:string; value:string|number; delta?:string; deltaUp?:boolean }) {
  return (
    <div className="glass p-5">
      <div className="text-xs font-semibold text-[var(--text-3)] uppercase tracking-widest mb-2">{label}</div>
      <div className="text-[32px] font-extrabold tracking-tight text-white leading-none">{value}</div>
      {delta && <div className={clsx("text-xs font-medium mt-2", deltaUp?"text-[var(--green)]":"text-[var(--text-3)]")}>{delta}</div>}
    </div>
  );
}

export function EmptyState({ icon="◌", message }: { icon?:string; message:string }) {
  return (
    <div className="text-center py-20 text-[var(--text-3)]">
      <div className="text-5xl mb-4 opacity-20">{icon}</div>
      <div className="text-sm font-medium">{message}</div>
    </div>
  );
}

export function SectionLabel({ children }: { children:React.ReactNode }) {
  return <div className="text-xs font-semibold text-[var(--text-3)] uppercase tracking-widest mb-2">{children}</div>;
}

export function Spinner({ size=16 }: { size?:number }) {
  return <div className="animate-spin rounded-full border-2 border-[var(--border)] border-t-white" style={{width:size,height:size}} />;
}

export function Divider() { return <div className="h-px bg-[var(--border)] my-4" />; }

export function SkillTag({ label }: { label:string }) {
  return (
    <span className="text-xs font-medium px-2.5 py-1 rounded-lg border border-[var(--border-2)] text-[var(--text-2)]">
      {label}
    </span>
  );
}
