import RolesGrid from "@/components/roles/RolesGrid";

export default function RolesPage() {
  return (
    <div className="animate-fade-in">
      <div className="mb-6">
        <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-[#F2F2F2]">Roles</h1>
        <div className="font-mono text-[11px] sm:text-xs text-[#B0B0B0] mt-1 uppercase tracking-widest font-medium">
          MANAGE HIRING ROLES · KEYWORDS · SCORING CONFIG
        </div>
      </div>
      <RolesGrid />
    </div>
  );
}
