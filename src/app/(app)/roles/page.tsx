import RolesGrid from "@/components/roles/RolesGrid";

export default function RolesPage() {
  return (
    <div className="animate-fade-in max-w-[1600px] mx-auto">
      <div className="mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white">Roles</h1>
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-mono font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              Active System
            </span>
          </div>
          <div className="font-mono text-[11px] sm:text-xs text-[var(--text-3)] mt-1 uppercase tracking-widest">
            Manage hiring roles · Keywords · Scoring config
          </div>
        </div>
      </div>
      <RolesGrid />
    </div>
  );
}

