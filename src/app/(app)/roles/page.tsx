import RolesGrid from "@/components/roles/RolesGrid";

export default function RolesPage() {
  return (
    <div className="animate-fade-in">
      <div className="mb-6">
        <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">Roles</h1>
        <div className="font-mono text-[11px] sm:text-xs text-[var(--text-3)] mt-1 uppercase tracking-widest">
          Manage hiring roles · Keywords · Scoring config
        </div>
      </div>
      <RolesGrid />
    </div>
  );
}
