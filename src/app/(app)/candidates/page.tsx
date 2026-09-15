import CandidatesTable from "@/components/candidates/CandidatesTable";

export default function CandidatesPage() {
  return (
    <div className="animate-fade-in">
      <div className="flex items-start justify-between mb-5">
        <div>
          <h1 className="text-[28px] sm:text-[30px] font-bold tracking-tight text-[#F3F4F6] leading-[1.15]">Candidates</h1>
          <div className="text-[11.5px] font-semibold text-[#70757F] mt-1.5 uppercase tracking-[0.08em]">
            All applicants · Filter · Review · Score
          </div>
        </div>
      </div>
      <CandidatesTable />
    </div>
  );
}
