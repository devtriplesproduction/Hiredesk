"use client";
import React from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { clsx } from "clsx";

export interface PaginationProps {
  currentPage: number;
  totalItems: number;
  pageSize?: number;
  onPageChange: (page: number) => void;
  itemName?: string;
  className?: string;
}

function getPageNumbers(currentPage: number, totalPages: number): (number | "...")[] {
  if (totalPages <= 7) {
    return Array.from({ length: totalPages }, (_, i) => i + 1);
  }

  if (currentPage <= 4) {
    return [1, 2, 3, 4, 5, "...", totalPages];
  }

  if (currentPage >= totalPages - 3) {
    return [1, "...", totalPages - 4, totalPages - 3, totalPages - 2, totalPages - 1, totalPages];
  }

  return [1, "...", currentPage - 1, currentPage, currentPage + 1, "...", totalPages];
}

export function Pagination({
  currentPage,
  totalItems,
  pageSize = 10,
  onPageChange,
  itemName = "entries",
  className,
}: PaginationProps) {
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));
  const safePage = Math.min(Math.max(1, currentPage), totalPages);

  const startItem = totalItems === 0 ? 0 : (safePage - 1) * pageSize + 1;
  const endItem = Math.min(safePage * pageSize, totalItems);

  const pages = getPageNumbers(safePage, totalPages);

  const canPrev = safePage > 1;
  const canNext = safePage < totalPages;

  return (
    <div
      className={clsx(
        "flex flex-col sm:flex-row items-center justify-between gap-3 py-3.5 px-2 mt-4 select-none",
        className
      )}
    >
      {/* Entries Info */}
      <div className="text-[13px] text-[var(--text-3)] font-medium text-center sm:text-left">
        Showing{" "}
        <span className="font-semibold text-[var(--text)]">
          {startItem}–{endItem}
        </span>{" "}
        of{" "}
        <span className="font-semibold text-[var(--text)]">{totalItems}</span>{" "}
        {itemName}
      </div>

      {/* Page Navigation Controls */}
      <div className="inline-flex items-center gap-1.5 flex-wrap justify-center">
        {/* Previous Button */}
        <button
          type="button"
          onClick={() => canPrev && onPageChange(safePage - 1)}
          disabled={!canPrev}
          aria-label="Previous page"
          className={clsx(
            "h-8 px-2.5 rounded-[8px] text-[12.5px] font-medium inline-flex items-center gap-1 border transition-all duration-150",
            canPrev
              ? "bg-[var(--glass-2)] text-[var(--text-2)] hover:text-text hover:bg-[var(--glass-3)] border-[var(--border-2)] cursor-pointer active:scale-95"
              : "opacity-40 cursor-not-allowed bg-transparent border-[var(--border)] text-[var(--text-3)]"
          )}
        >
          <ChevronLeft size={15} />
          <span className="hidden xs:inline">Prev</span>
        </button>

        {/* Page numbers */}
        <div className="inline-flex items-center gap-1">
          {pages.map((item, idx) => {
            if (item === "...") {
              return (
                <span
                  key={`ellipsis-${idx}`}
                  className="w-7 h-8 inline-flex items-center justify-center text-[var(--text-3)] text-[13px]"
                >
                  …
                </span>
              );
            }

            const pageNum = item as number;
            const isActive = pageNum === safePage;

            return (
              <button
                key={pageNum}
                type="button"
                onClick={() => onPageChange(pageNum)}
                aria-label={`Page ${pageNum}`}
                aria-current={isActive ? "page" : undefined}
                className={clsx(
                  "min-w-[32px] h-8 px-2 rounded-[8px] text-[12.5px] font-medium transition-all duration-150 cursor-pointer",
                  isActive
                    ? "bg-[rgba(0,217,255,0.15)] text-[#00D9FF] border border-[rgba(0,217,255,0.45)] font-bold shadow-[0_0_12px_rgba(0,217,255,0.2)]"
                    : "bg-[var(--glass-2)] text-[var(--text-2)] hover:text-text hover:bg-[var(--glass-3)] border border-[var(--border-2)]"
                )}
              >
                {pageNum}
              </button>
            );
          })}
        </div>

        {/* Next Button */}
        <button
          type="button"
          onClick={() => canNext && onPageChange(safePage + 1)}
          disabled={!canNext}
          aria-label="Next page"
          className={clsx(
            "h-8 px-2.5 rounded-[8px] text-[12.5px] font-medium inline-flex items-center gap-1 border transition-all duration-150",
            canNext
              ? "bg-[var(--glass-2)] text-[var(--text-2)] hover:text-text hover:bg-[var(--glass-3)] border-[var(--border-2)] cursor-pointer active:scale-95"
              : "opacity-40 cursor-not-allowed bg-transparent border-[var(--border)] text-[var(--text-3)]"
          )}
        >
          <span className="hidden xs:inline">Next</span>
          <ChevronRight size={15} />
        </button>
      </div>
    </div>
  );
}
