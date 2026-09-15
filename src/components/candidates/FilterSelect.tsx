"use client";
import React, { useState, useRef, useEffect } from "react";
import { clsx } from "clsx";
import { ChevronDown, Search, X } from "lucide-react";

export interface FilterOption {
  value: string;
  label: string;
  icon?: React.ReactNode;
}

export interface FilterSelectProps {
  options: FilterOption[];
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  icon?: React.ReactNode;
  align?: "left" | "right";
  className?: string;
  containerClassName?: string;
  disabled?: boolean;
  title?: string;
}

/**
 * Reusable dropdown filter component for HireDesk candidate filtering.
 * Features:
 * - Consistent 40px height, #151719 bg, #303238 border, rounded-[9px]
 * - HireDesk cyan focus/open state (#00D9FF)
 * - Popover menu expands wider (w-max) so long role names aren't cut off
 * - Selected item highlighting with cyan accent
 * - Keyboard navigation (Escape, Enter) and click-outside dismissal
 */
export function FilterSelect({
  options,
  value,
  onChange,
  placeholder,
  icon,
  align = "left",
  className,
  containerClassName,
  disabled = false,
  title,
}: FilterSelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const selectedOpt = options.find(o => o.value === value);
  const displayText = selectedOpt?.label || placeholder || "Select...";
  const isDefault = value === "all" || value === "" || value === "newest";

  useEffect(() => {
    if (!isOpen) return;

    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    }

    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") {
        setIsOpen(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen]);

  return (
    <div
      ref={containerRef}
      className={clsx("relative", isOpen ? "z-30" : "z-10", containerClassName)}
      title={title}
    >
      <button
        type="button"
        onClick={() => !disabled && setIsOpen(prev => !prev)}
        disabled={disabled}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        className={clsx(
          "h-[40px] px-3 rounded-[9px] text-[12.5px] font-medium transition-all duration-150 flex items-center justify-between gap-1.5 outline-none select-none text-left w-full cursor-pointer",
          "bg-[#151719] hover:bg-[#1A1D21] border",
          isOpen
            ? "border-[#00D9FF] ring-1 ring-[#00D9FF]/20 text-[#E8E8E8]"
            : !isDefault
            ? "border-[#00D9FF]/50 text-[#F2F2F2] bg-[#16191D]"
            : "border-[#303238] hover:border-[#3E434D] text-[#E8E8E8]",
          disabled && "opacity-50 cursor-not-allowed",
          className
        )}
      >
        <div className="flex items-center gap-1.5 min-w-0 flex-1">
          {icon && <span className="flex-shrink-0 text-[#8A8F98]">{icon}</span>}
          <span className={clsx("truncate", !isDefault ? "text-[#F2F2F2] font-semibold" : "text-[#E8E8E8]")}>
            {displayText}
          </span>
        </div>
        <ChevronDown
          size={13}
          className={clsx(
            "flex-shrink-0 transition-transform duration-150",
            isOpen ? "rotate-180 text-[#00D9FF]" : "text-[#8A8F98]"
          )}
        />
      </button>

      {isOpen && (
        <div
          role="listbox"
          className={clsx(
            "absolute top-[calc(100%+5px)] py-1 bg-[#151719] border border-[#303238] rounded-[10px] shadow-2xl shadow-black/80 max-h-[280px] overflow-y-auto",
            align === "right" ? "right-0" : "left-0",
            "min-w-full w-max max-w-[300px]"
          )}
        >
          {options.map(opt => {
            const isSelected = opt.value === value;
            return (
              <div
                key={opt.value}
                role="option"
                aria-selected={isSelected}
                onClick={() => {
                  onChange(opt.value);
                  setIsOpen(false);
                }}
                className={clsx(
                  "px-3 py-2 mx-1 text-[12.5px] cursor-pointer flex items-center justify-between gap-3 rounded-[6px] transition-colors select-none",
                  isSelected
                    ? "bg-[rgba(0,217,255,0.08)] text-[#00D9FF] font-semibold"
                    : "text-[#E8E8E8] hover:bg-[#1C2025] hover:text-[#00D9FF]"
                )}
              >
                <div className="flex items-center gap-2 truncate">
                  {opt.icon && <span className="flex-shrink-0">{opt.icon}</span>}
                  <span className="truncate">{opt.label}</span>
                </div>
                {isSelected && <span className="text-[#00D9FF] text-xs font-bold flex-shrink-0">✓</span>}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

/**
 * Reusable search input component matching the FilterSelect style
 */
export function FilterSearch({
  value,
  onChange,
  placeholder = "Search name / email…",
  className,
}: {
  value: string;
  onChange: (val: string) => void;
  placeholder?: string;
  className?: string;
}) {
  return (
    <div
      className={clsx(
        "h-[40px] bg-[#151719] hover:bg-[#1A1D21] border border-[#303238] hover:border-[#3E434D] focus-within:border-[#00D9FF] focus-within:ring-1 focus-within:ring-[#00D9FF]/20 rounded-[9px] flex items-center transition-all duration-150",
        className
      )}
    >
      <Search size={14} className="text-[#8A8F98] ml-3 flex-shrink-0" />
      <input
        type="text"
        className="h-full w-full bg-transparent text-[#E8E8E8] text-[12.5px] font-medium px-2.5 py-2 placeholder:text-[#8A8F98] outline-none"
        placeholder={placeholder}
        value={value}
        onChange={e => onChange(e.target.value)}
      />
      {value && (
        <button
          type="button"
          onClick={() => onChange("")}
          className="mr-2.5 text-[#8A8F98] hover:text-[#E8E8E8] p-1 transition-colors flex-shrink-0 cursor-pointer"
          title="Clear search"
        >
          <X size={13} />
        </button>
      )}
    </div>
  );
}
