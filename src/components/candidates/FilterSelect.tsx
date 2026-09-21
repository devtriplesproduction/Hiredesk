"use client";
import React, { useState, useRef, useEffect } from "react";
import { clsx } from "clsx";
import { ChevronDown, Search, X } from "lucide-react";

export interface FilterOption {
  value: string;
  label: string;
  icon?: React.ReactNode;
  group?: string;
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
  menuClassName?: string;
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
  menuClassName,
  disabled = false,
  title,
}: FilterSelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [focusedIndex, setFocusedIndex] = useState(-1);
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
        return;
      }
      if (e.key === "ArrowDown") {
        e.preventDefault();
        setFocusedIndex(prev => (prev < options.length - 1 ? prev + 1 : 0));
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        setFocusedIndex(prev => (prev > 0 ? prev - 1 : options.length - 1));
      } else if (e.key === "Enter" && focusedIndex >= 0 && focusedIndex < options.length) {
        e.preventDefault();
        onChange(options[focusedIndex].value);
        setIsOpen(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen, focusedIndex, options, onChange]);

  const handleTriggerKeyDown = (e: React.KeyboardEvent<HTMLButtonElement>) => {
    if (disabled) return;
    if (e.key === "ArrowDown" || e.key === "ArrowUp") {
      e.preventDefault();
      setIsOpen(true);
      const selIdx = options.findIndex(o => o.value === value);
      setFocusedIndex(selIdx >= 0 ? selIdx : 0);
    }
  };

  return (
    <div
      ref={containerRef}
      className={clsx("relative", isOpen ? "z-50" : "z-10", containerClassName)}
      title={title}
    >
      <button
        type="button"
        onClick={() => {
          if (!disabled) {
            setIsOpen(prev => {
              const next = !prev;
              if (next) {
                const selIdx = options.findIndex(o => o.value === value);
                setFocusedIndex(selIdx >= 0 ? selIdx : 0);
              }
              return next;
            });
          }
        }}
        onKeyDown={handleTriggerKeyDown}
        disabled={disabled}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        className={clsx(
          "h-[40px] px-3 rounded-[9px] text-[12.5px] font-medium transition-all duration-150 flex items-center justify-between gap-1.5 outline-none select-none text-left w-full cursor-pointer",
          "bg-[var(--input-bg)] hover:bg-[var(--card-bg)] border",
          isOpen
            ? "border-[#00D9FF] ring-1 ring-[#00D9FF]/20 text-[var(--text)]"
            : !isDefault
            ? "border-[#00D9FF]/50 text-[var(--text)] bg-[var(--card-bg)]"
            : "border-[var(--border-2)] hover:border-[var(--border-2)] text-[var(--text)]",
          disabled && "opacity-50 cursor-not-allowed",
          className
        )}
      >
        <div className="flex items-center gap-1.5 min-w-0 flex-1">
          {icon && <span className="flex-shrink-0 text-[var(--text-3)]">{icon}</span>}
          <span className={clsx("truncate", !isDefault ? "text-[var(--text)] font-semibold" : "text-[var(--text)]")}>
            {displayText}
          </span>
        </div>
        <ChevronDown
          size={13}
          className={clsx(
            "flex-shrink-0 transition-transform duration-150",
            isOpen ? "rotate-180 text-[#00D9FF]" : "text-[var(--text-3)]"
          )}
        />
      </button>

      {isOpen && (
        <div
          role="listbox"
          className={clsx(
            "absolute top-[calc(100%+5px)] py-1.5 bg-[var(--input-bg)] border border-[var(--border-2)] rounded-[10px] shadow-2xl shadow-black/80 max-h-[300px] overflow-y-auto z-50",
            align === "right" ? "right-0" : "left-0",
            menuClassName ? menuClassName : "min-w-full w-max max-w-[300px]"
          )}
        >
          {options.map((opt, idx) => {
            const isSelected = opt.value === value;
            const isFocused = idx === focusedIndex;
            const showGroupHeader = opt.group && (idx === 0 || options[idx - 1]?.group !== opt.group);

            return (
              <React.Fragment key={opt.value}>
                {showGroupHeader && (
                  <div
                    className={clsx(
                      "px-3 pb-1 text-[10.5px] font-bold uppercase tracking-wider text-[var(--text-3)] select-none",
                      idx === 0 ? "pt-1" : "pt-2.5 border-t border-[var(--border-2)] mt-1"
                    )}
                  >
                    {opt.group}
                  </div>
                )}
                <div
                  role="option"
                  aria-selected={isSelected}
                  onClick={() => {
                    onChange(opt.value);
                    setIsOpen(false);
                  }}
                  onMouseEnter={() => setFocusedIndex(idx)}
                  className={clsx(
                    "px-3 py-2 mx-1 text-[12.5px] cursor-pointer flex items-center justify-between gap-3 rounded-[6px] transition-colors select-none",
                    isSelected
                      ? "bg-[rgba(0,217,255,0.08)] text-[#00D9FF] font-semibold"
                      : isFocused
                      ? "bg-[var(--card-bg)] text-[#00D9FF]"
                      : "text-[var(--text)] hover:bg-[var(--card-bg)] hover:text-[#00D9FF]"
                  )}
                >
                  <div className="flex items-center gap-2 truncate">
                    {opt.icon && <span className="flex-shrink-0">{opt.icon}</span>}
                    <span className="truncate">{opt.label}</span>
                  </div>
                  {isSelected && <span className="text-[#00D9FF] text-xs font-bold flex-shrink-0">✓</span>}
                </div>
              </React.Fragment>
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
        "h-[40px] bg-[var(--input-bg)] hover:bg-[var(--card-bg)] border border-[var(--border-2)] hover:border-[var(--border-2)] focus-within:border-[#00D9FF] focus-within:ring-1 focus-within:ring-[#00D9FF]/20 rounded-[9px] flex items-center transition-all duration-150",
        className
      )}
    >
      <Search size={14} className="text-[var(--text-3)] ml-3 flex-shrink-0" />
      <input
        type="text"
        className="h-full w-full bg-transparent text-[var(--text)] text-[12.5px] font-medium px-2.5 py-2 placeholder:text-[var(--text-3)] outline-none"
        placeholder={placeholder}
        value={value}
        onChange={e => onChange(e.target.value)}
      />
      {value && (
        <button
          type="button"
          onClick={() => onChange("")}
          className="mr-2.5 text-[var(--text-3)] hover:text-[var(--text)] p-1 transition-colors flex-shrink-0 cursor-pointer"
          title="Clear search"
        >
          <X size={13} />
        </button>
      )}
    </div>
  );
}
