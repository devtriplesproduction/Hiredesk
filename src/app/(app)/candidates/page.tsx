import CandidatesTable from "@/components/candidates/CandidatesTable";

export default function CandidatesPage() {
  return (
    <div className="animate-fade-in">
      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 className="text-[22px] font-extrabold tracking-tight">Candidates</h1>
          <div className="font-mono text-[10px] text-[var(--text-3)] mt-1 uppercase tracking-widest">
            All applicants · Filter · Review · Score
          </div>
        </div>
      </div>
      <CandidatesTable />
    </div>
  );
}
