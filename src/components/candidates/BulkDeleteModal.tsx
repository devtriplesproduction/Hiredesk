"use client";
import { useState } from "react";
import { Modal, Btn } from "@/components/ui";
import { useStore } from "@/lib/store";

interface Props { open: boolean; onClose: () => void; }

export default function BulkDeleteModal({ open, onClose }: Props) {
  const { candidates, deleteBelowScore } = useStore();
  const [threshold, setThreshold] = useState(40);

  const willDelete = candidates.filter(c => c.score.total < threshold).length;

  function execute() {
    const deleted = deleteBelowScore(threshold);
    alert(`Deleted ${deleted} candidate${deleted !== 1 ? "s" : ""} with score below ${threshold}.`);
    onClose();
  }

  return (
    <Modal open={open} onClose={onClose} className="max-w-sm w-full">
      <div className="text-[17px] font-bold mb-1">Bulk Delete by Score</div>
      <div className="font-mono text-[10px] text-[var(--text-3)] mb-6">Remove all candidates scoring below the threshold</div>

      <div className="text-center mb-4">
        <div className="text-[48px] font-extrabold tracking-tighter text-[var(--red)] leading-none">{threshold}</div>
        <div className="font-mono text-[10px] text-[var(--text-3)] mt-2">
          {willDelete} candidate{willDelete !== 1 ? "s" : ""} will be deleted
        </div>
      </div>

      <input
        type="range" min={0} max={100} value={threshold}
        onChange={e => setThreshold(Number(e.target.value))}
        className="w-full mb-1"
      />
      <div className="flex justify-between font-mono text-[9px] text-[var(--text-3)] mb-6">
        <span>0</span><span>50</span><span>100</span>
      </div>

      <div className="h-px bg-[var(--border)] mb-4" />

      <div className="flex justify-end gap-2">
        <Btn variant="ghost" onClick={onClose}>Cancel</Btn>
        <Btn variant="danger" onClick={execute} disabled={willDelete === 0}>
          Delete {willDelete > 0 ? `${willDelete} Candidate${willDelete !== 1 ? "s" : ""}` : "(None)"}
        </Btn>
      </div>
    </Modal>
  );
}
