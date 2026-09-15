"use client";
import { useState } from "react";
import { Modal, dialog } from "@/components/ui";
import { useStore } from "@/lib/store";
import { clsx } from "clsx";

interface Props { open: boolean; onClose: () => void; }

export default function BulkDeleteModal({ open, onClose }: Props) {
  const { candidates, deleteBelowScore } = useStore();
  const [threshold, setThreshold] = useState(40);
  const [isDeleting, setIsDeleting] = useState(false);

  const willDelete = candidates.filter(c => c.score.total < threshold).length;

  async function execute() {
    if (isDeleting || willDelete === 0) return;
    setIsDeleting(true);
    try {
      const res = await deleteBelowScore(threshold);
      onClose();
      dialog.success({
        title: "Candidates Deleted",
        message: `Deleted ${res} candidate${res !== 1 ? "s" : ""} with score below ${threshold}.`,
      });
    } catch (err: any) {
      console.error("[BulkDeleteModal] Error:", err);
      dialog.error({
        title: "Bulk Deletion Failed",
        message: `Unable to delete candidates: ${err?.message || "Database error"}. The records were not removed.`,
      });
    } finally {
      setIsDeleting(false);
    }
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      className="!max-w-[380px] w-full !bg-[#111315] !border-[#2A2E35] !rounded-[14px] !p-[26px] sm:!p-[28px] shadow-[0_20px_50px_rgba(0,0,0,0.8)]"
    >
      {/* Modal Title */}
      <h3 className="text-[17.5px] font-bold text-[#E7E9ED] leading-[1.2] text-left">
        Bulk Delete by Score
      </h3>

      {/* Description */}
      <p className="text-[11.5px] text-[#737983] leading-[1.5] mt-1.5 text-left">
        Remove all candidates scoring below the threshold
      </p>

      {/* Score Display & Delete Count */}
      <div className="text-center my-5">
        <div className="text-[48px] font-bold text-[#F5C542] leading-none select-none tracking-tight">
          {threshold}
        </div>
        <div className="text-[11.5px] text-[#70757F] mt-2.5">
          {willDelete} candidate{willDelete !== 1 ? "s" : ""} will be deleted
        </div>
      </div>

      {/* Score Slider */}
      <div className="w-full">
        <input
          type="range"
          min={0}
          max={100}
          value={threshold}
          onChange={e => setThreshold(Number(e.target.value))}
          className="bulk-score-slider"
          style={{
            background: `linear-gradient(to right, #F5C542 0%, #F5C542 ${threshold}%, #262A30 ${threshold}%, #262A30 100%)`,
          }}
        />
        {/* Scale labels */}
        <div className="flex justify-between text-[11px] font-medium text-[#70757F] mt-2 select-none">
          <span>0</span>
          <span>50</span>
          <span>100</span>
        </div>
      </div>

      {/* Subtle Divider */}
      <div className="h-px bg-[#24282E] my-5" />

      {/* Actions */}
      <div className="flex justify-end items-center gap-2.5">
        <button
          type="button"
          onClick={onClose}
          disabled={isDeleting}
          className="h-[35px] px-4 rounded-[8px] text-[11.5px] font-semibold uppercase tracking-wider bg-[#151719] border border-[#2B2F35] text-[#9A9FA8] hover:bg-[#1D2024] hover:text-[#E1E4E8] hover:border-[#383D45] transition-all duration-150 cursor-pointer select-none active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Cancel
        </button>
        <button
          type="button"
          onClick={execute}
          disabled={willDelete === 0 || isDeleting}
          className={clsx(
            "h-[35px] px-4 rounded-[8px] text-[11.5px] font-semibold uppercase tracking-wider transition-all duration-150 select-none border",
            willDelete === 0 || isDeleting
              ? "bg-red-500/5 border-red-500/15 text-red-500/35 cursor-not-allowed"
              : "bg-red-500/15 border-red-500/40 text-[#EF4444] hover:bg-red-500/25 hover:border-red-500/60 cursor-pointer active:scale-[0.98]"
          )}
        >
          {isDeleting
            ? "Deleting..."
            : `Delete ${willDelete > 0 ? `${willDelete} Candidate${willDelete !== 1 ? "s" : ""}` : "(None)"}`}
        </button>
      </div>
    </Modal>
  );
}
