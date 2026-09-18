import { Suspense } from "react";
import ContractsList from "@/components/contracts/ContractsList";
import { ShieldCheck } from "lucide-react";

export default function ContractsPage() {
  return (
    <div className="animate-fade-in max-w-[1600px] mx-auto pb-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-6 sm:mb-8 pb-5 border-b border-white/[0.06]">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white">
              Contracts &amp; Agreements
            </h1>
            <span className="hidden xs:inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[15px] font-mono font-semibold text-[#00D9FF] bg-[#00D9FF]/10 border border-[#00D9FF]/25">
              8 Templates
            </span>
          </div>
          <div className="font-mono text-[15px] sm:text-xs text-[#8E95A2] mt-1.5 uppercase tracking-widest flex items-center gap-2 flex-wrap">
            <span>Agency-grade legal documents</span>
            <span className="text-white/20">·</span>
            <span>Triple S Production branding</span>
            <span className="text-white/20">·</span>
            <span className="text-[#22C55E]/90 font-medium">Satara Jurisdiction</span>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-[#131417] border border-[#262930] text-xs text-[#9DA3AE]">
            <ShieldCheck size={14} className="text-[#22C55E]" />
            <span className="font-medium text-[#C8CDD5]">Standard Legal Compliance</span>
          </div>
        </div>
      </div>

      <Suspense fallback={null}>
        <ContractsList />
      </Suspense>
    </div>
  );
}
