"use client";
import React, { useState, useEffect, useRef, useMemo, useCallback } from "react";
import { createPortal } from "react-dom";

interface DateTimePickerProps {
  value: string; // ISO string or parsable date string
  onChange: (val: string) => void;
  placeholder?: string;
  className?: string;
  hasError?: boolean;
}

const MONTH_NAMES = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December"
];

const DAYS_SHORT = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"];

export default function DateTimePicker({
  value,
  onChange,
  placeholder = "📅 Select interview date & time...",
  className = "",
  hasError = false,
}: DateTimePickerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [coords, setCoords] = useState<{ top: number; left: number }>({ top: 0, left: 0 });

  // Parse initial or current value
  const parsedDate = useMemo(() => {
    if (!value) return null;
    const d = new Date(value);
    return isNaN(d.getTime()) ? null : d;
  }, [value]);

  // Calendar navigation state (year & month)
  const [viewYear, setViewYear] = useState(() => parsedDate ? parsedDate.getFullYear() : new Date().getFullYear());
  const [viewMonth, setViewMonth] = useState(() => parsedDate ? parsedDate.getMonth() : new Date().getMonth());

  // Time state (12-hour format)
  const [hour, setHour] = useState(() => {
    if (!parsedDate) return 4;
    const h = parsedDate.getHours();
    return h === 0 ? 12 : h > 12 ? h - 12 : h;
  });

  const [minute, setMinute] = useState(() => {
    if (!parsedDate) return 0;
    return parsedDate.getMinutes();
  });

  const [period, setPeriod] = useState<"AM" | "PM">(() => {
    if (!parsedDate) return "PM";
    return parsedDate.getHours() >= 12 ? "PM" : "AM";
  });

  // Sync internal time/calendar view when value changes externally
  useEffect(() => {
    if (parsedDate) {
      setViewYear(parsedDate.getFullYear());
      setViewMonth(parsedDate.getMonth());
      const h = parsedDate.getHours();
      setHour(h === 0 ? 12 : h > 12 ? h - 12 : h);
      setMinute(parsedDate.getMinutes());
      setPeriod(h >= 12 ? "PM" : "AM");
    }
  }, [parsedDate]);

  const triggerRef = useRef<HTMLButtonElement>(null);
  const popoverRef = useRef<HTMLDivElement>(null);

  // Position calculation (Upward opening with graceful viewport clamping)
  const updatePosition = useCallback(() => {
    if (!triggerRef.current) return;
    const rect = triggerRef.current.getBoundingClientRect();
    const popupWidth = 320;
    const popupHeight = 390;

    // Upward opening by default
    let top = rect.top - popupHeight - 8;

    // If not enough space above, check if downward space is larger
    if (top < 12) {
      if (window.innerHeight - rect.bottom > popupHeight + 12) {
        top = rect.bottom + 8;
      } else {
        // Clamp within viewport
        top = Math.max(12, Math.min(top, window.innerHeight - popupHeight - 12));
      }
    }

    let left = rect.left;
    if (window.innerWidth < 640) {
      // Mobile: center in viewport
      left = Math.max(12, (window.innerWidth - popupWidth) / 2);
    } else {
      // Desktop / Tablet: align with field, clamped to viewport boundaries
      if (left + popupWidth > window.innerWidth - 16) {
        left = window.innerWidth - popupWidth - 16;
      }
      if (left < 16) {
        left = 16;
      }
    }

    setCoords({ top, left });
  }, []);

  useEffect(() => {
    if (isOpen) {
      updatePosition();
      const handleScroll = () => updatePosition();
      const handleResize = () => updatePosition();
      window.addEventListener("scroll", handleScroll, true);
      window.addEventListener("resize", handleResize);

      const handlePointerDown = (e: MouseEvent) => {
        if (
          triggerRef.current?.contains(e.target as Node) ||
          popoverRef.current?.contains(e.target as Node)
        ) {
          return;
        }
        setIsOpen(false);
      };

      document.addEventListener("mousedown", handlePointerDown);
      return () => {
        window.removeEventListener("scroll", handleScroll, true);
        window.removeEventListener("resize", handleResize);
        document.removeEventListener("mousedown", handlePointerDown);
      };
    }
  }, [isOpen, updatePosition]);

  // Calendar navigation
  const handlePrevMonth = () => {
    if (viewMonth === 0) {
      setViewMonth(11);
      setViewYear(y => y - 1);
    } else {
      setViewMonth(m => m - 1);
    }
  };

  const handleNextMonth = () => {
    if (viewMonth === 11) {
      setViewMonth(0);
      setViewYear(y => y + 1);
    } else {
      setViewMonth(m => m + 1);
    }
  };

  // Construct ISO string from a specific Date and current time settings
  const assembleDateTime = (dateObj: Date, h: number, m: number, p: "AM" | "PM") => {
    const d = new Date(dateObj);
    let hour24 = h;
    if (p === "AM") {
      if (hour24 === 12) hour24 = 0;
    } else {
      if (hour24 !== 12) hour24 += 12;
    }
    d.setHours(hour24, m, 0, 0);
    return d.toISOString();
  };

  // When a day is clicked
  const handleSelectDay = (year: number, month: number, day: number) => {
    const targetDate = new Date(year, month, day);
    const iso = assembleDateTime(targetDate, hour, minute, period);
    onChange(iso);
  };

  // When time components change
  const handleTimeChange = (newHour: number, newMinute: number, newPeriod: "AM" | "PM") => {
    setHour(newHour);
    setMinute(newMinute);
    setPeriod(newPeriod);

    const baseDate = parsedDate ? new Date(parsedDate) : new Date();
    const iso = assembleDateTime(baseDate, newHour, newMinute, newPeriod);
    onChange(iso);
  };

  // Clear selection
  const handleClear = () => {
    onChange("");
  };

  // Today jump & select
  const handleToday = () => {
    const now = new Date();
    setViewYear(now.getFullYear());
    setViewMonth(now.getMonth());
    const iso = assembleDateTime(now, hour, minute, period);
    onChange(iso);
  };

  // Calendar Grid Calculation
  const calendarGrid = useMemo(() => {
    const firstDayIndex = new Date(viewYear, viewMonth, 1).getDay();
    const daysInCurrentMonth = new Date(viewYear, viewMonth + 1, 0).getDate();
    const daysInPrevMonth = new Date(viewYear, viewMonth, 0).getDate();

    const cells: {
      day: number;
      month: number;
      year: number;
      isCurrentMonth: boolean;
      isToday: boolean;
      isSelected: boolean;
    }[] = [];

    const today = new Date();
    const isSameYearMonthToday = today.getFullYear() === viewYear && today.getMonth() === viewMonth;
    const todayDate = today.getDate();

    // Previous month filler days
    for (let i = firstDayIndex - 1; i >= 0; i--) {
      const d = daysInPrevMonth - i;
      const m = viewMonth === 0 ? 11 : viewMonth - 1;
      const y = viewMonth === 0 ? viewYear - 1 : viewYear;
      cells.push({
        day: d,
        month: m,
        year: y,
        isCurrentMonth: false,
        isToday: false,
        isSelected: !!parsedDate && parsedDate.getFullYear() === y && parsedDate.getMonth() === m && parsedDate.getDate() === d,
      });
    }

    // Current month days
    for (let d = 1; d <= daysInCurrentMonth; d++) {
      cells.push({
        day: d,
        month: viewMonth,
        year: viewYear,
        isCurrentMonth: true,
        isToday: isSameYearMonthToday && d === todayDate,
        isSelected: !!parsedDate && parsedDate.getFullYear() === viewYear && parsedDate.getMonth() === viewMonth && parsedDate.getDate() === d,
      });
    }

    // Next month filler days up to 42 (6 rows)
    const remaining = 42 - cells.length;
    for (let d = 1; d <= remaining; d++) {
      const m = viewMonth === 11 ? 0 : viewMonth + 1;
      const y = viewMonth === 11 ? viewYear + 1 : viewYear;
      cells.push({
        day: d,
        month: m,
        year: y,
        isCurrentMonth: false,
        isToday: false,
        isSelected: !!parsedDate && parsedDate.getFullYear() === y && parsedDate.getMonth() === m && parsedDate.getDate() === d,
      });
    }

    return cells;
  }, [viewYear, viewMonth, parsedDate]);

  // Formatted display string
  const displayString = useMemo(() => {
    if (!parsedDate) return null;
    const day = String(parsedDate.getDate()).padStart(2, "0");
    const month = String(parsedDate.getMonth() + 1).padStart(2, "0");
    const year = parsedDate.getFullYear();
    const h = parsedDate.getHours();
    const displayHour = String(h === 0 ? 12 : h > 12 ? h - 12 : h).padStart(2, "0");
    const displayMin = String(parsedDate.getMinutes()).padStart(2, "0");
    const displayPeriod = h >= 12 ? "PM" : "AM";
    return `${day}/${month}/${year}  ${displayHour}:${displayMin} ${displayPeriod}`;
  }, [parsedDate]);

  return (
    <div className="relative flex-1">
      {/* Trigger Button Field */}
      <button
        ref={triggerRef}
        type="button"
        onClick={() => setIsOpen(prev => !prev)}
        className={`w-full flex items-center justify-between gap-2 px-3 py-2 rounded-lg text-xs font-mono transition-all duration-150 text-left outline-none ${
          hasError
            ? "border border-red-500/50 bg-red-500/5"
            : isOpen
            ? "border-[#A78BFA]/50 bg-[#161619] shadow-[0_0_12px_rgba(167,139,250,0.15)]"
            : "border-[var(--border)] bg-[var(--glass-3)] hover:border-[var(--border-2)] hover:bg-[var(--glass-2)]"
        } ${className}`}
      >
        <span className={displayString ? "text-[#E6E8EB] font-medium" : "text-[var(--text-3)]"}>
          {displayString ? `📅  ${displayString}` : placeholder}
        </span>
        <span className="text-[10px] text-[var(--text-3)]">
          {isOpen ? "▲" : "▼"}
        </span>
      </button>

      {/* Popover Portal */}
      {isOpen && typeof document !== "undefined" && createPortal(
        <div
          ref={popoverRef}
          className="fixed z-[9999] w-[316px] rounded-2xl p-4 flex flex-col gap-3.5 shadow-2xl animate-fade-in font-sans"
          style={{
            top: `${coords.top}px`,
            left: `${coords.left}px`,
            background: "#111111",
            border: "1px solid #292929",
            boxShadow: "0 20px 40px -10px rgba(0,0,0,0.8), 0 0 0 1px rgba(255,255,255,0.06)",
            color: "#E6E8EB",
          }}
        >
          {/* Header: Month & Year Navigation */}
          <div className="flex items-center justify-between px-1">
            <div className="text-xs font-bold tracking-tight text-[#E6E8EB]">
              {MONTH_NAMES[viewMonth]} {viewYear}
            </div>
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={handlePrevMonth}
                className="w-7 h-7 rounded-lg flex items-center justify-center text-sm font-bold text-[#8B919C] hover:text-white hover:bg-white/10 transition-colors"
                title="Previous Month"
              >
                ‹
              </button>
              <button
                type="button"
                onClick={handleNextMonth}
                className="w-7 h-7 rounded-lg flex items-center justify-center text-sm font-bold text-[#8B919C] hover:text-white hover:bg-white/10 transition-colors"
                title="Next Month"
              >
                ›
              </button>
            </div>
          </div>

          {/* Days of Week Header */}
          <div className="grid grid-cols-7 gap-1 text-center">
            {DAYS_SHORT.map(d => (
              <div key={d} className="text-[10px] font-mono font-semibold text-[#8B919C] uppercase tracking-wider py-0.5">
                {d}
              </div>
            ))}
          </div>

          {/* Calendar Grid */}
          <div className="grid grid-cols-7 gap-1">
            {calendarGrid.map((c, idx) => {
              const isSelected = c.isSelected;
              const isToday = c.isToday;
              const isCurrent = c.isCurrentMonth;

              return (
                <button
                  key={idx}
                  type="button"
                  onClick={() => handleSelectDay(c.year, c.month, c.day)}
                  className={`h-7 rounded-lg text-xs font-mono font-medium flex items-center justify-center relative transition-all duration-100 ${
                    isSelected
                      ? "text-[#00D9FF] bg-[rgba(0,217,255,0.15)] border border-[rgba(0,217,255,0.45)] font-bold shadow-[0_0_8px_rgba(0,217,255,0.2)]"
                      : isCurrent
                      ? "text-[#E6E8EB] hover:bg-white/10 hover:text-white"
                      : "text-[#474D57] hover:bg-white/5"
                  }`}
                >
                  <span>{c.day}</span>
                  {isToday && !isSelected && (
                    <span className="absolute bottom-1 w-1 h-1 rounded-full bg-[#00D9FF]" />
                  )}
                </button>
              );
            })}
          </div>

          {/* Divider */}
          <div className="h-px bg-[#242424] -mx-4" />

          {/* Time Selector */}
          <div className="flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-mono font-bold uppercase tracking-widest text-[#8B919C]">
                Time
              </span>
              <span className="text-[10px] font-mono text-[#A78BFA]">
                {String(hour).padStart(2, "0")}:{String(minute).padStart(2, "0")} {period}
              </span>
            </div>

            <div
              className="p-2 rounded-xl flex items-center justify-between gap-2"
              style={{ background: "#191919", border: "1px solid #292929" }}
            >
              {/* Hour Selector */}
              <div className="flex items-center gap-1.5 flex-1 justify-center">
                <button
                  type="button"
                  onClick={() => handleTimeChange(hour === 1 ? 12 : hour - 1, minute, period)}
                  className="w-6 h-6 rounded flex items-center justify-center text-xs text-[#8B919C] hover:text-white hover:bg-white/10 transition-colors"
                >
                  ▼
                </button>
                <div className="font-mono text-sm font-bold text-[#E6E8EB] w-7 text-center select-none">
                  {String(hour).padStart(2, "0")}
                </div>
                <button
                  type="button"
                  onClick={() => handleTimeChange(hour === 12 ? 1 : hour + 1, minute, period)}
                  className="w-6 h-6 rounded flex items-center justify-center text-xs text-[#8B919C] hover:text-white hover:bg-white/10 transition-colors"
                >
                  ▲
                </button>
              </div>

              <span className="text-sm font-bold text-[#8B919C] select-none">:</span>

              {/* Minute Selector (15-min intervals or steppers) */}
              <div className="flex items-center gap-1.5 flex-1 justify-center">
                <button
                  type="button"
                  onClick={() => handleTimeChange(hour, (minute - 15 + 60) % 60, period)}
                  className="w-6 h-6 rounded flex items-center justify-center text-xs text-[#8B919C] hover:text-white hover:bg-white/10 transition-colors"
                >
                  ▼
                </button>
                <div className="font-mono text-sm font-bold text-[#E6E8EB] w-7 text-center select-none">
                  {String(minute).padStart(2, "0")}
                </div>
                <button
                  type="button"
                  onClick={() => handleTimeChange(hour, (minute + 15) % 60, period)}
                  className="w-6 h-6 rounded flex items-center justify-center text-xs text-[#8B919C] hover:text-white hover:bg-white/10 transition-colors"
                >
                  ▲
                </button>
              </div>

              {/* AM / PM Toggle */}
              <div className="flex rounded-lg overflow-hidden border border-[#333333] p-0.5 bg-[#121212]">
                <button
                  type="button"
                  onClick={() => handleTimeChange(hour, minute, "AM")}
                  className={`px-2 py-1 rounded text-[10px] font-mono font-bold transition-all ${
                    period === "AM"
                      ? "text-[#A78BFA] bg-[rgba(167,139,250,0.15)] border border-[rgba(167,139,250,0.35)] shadow-sm"
                      : "text-[#8B919C] hover:text-white border border-transparent"
                  }`}
                >
                  AM
                </button>
                <button
                  type="button"
                  onClick={() => handleTimeChange(hour, minute, "PM")}
                  className={`px-2 py-1 rounded text-[10px] font-mono font-bold transition-all ${
                    period === "PM"
                      ? "text-[#A78BFA] bg-[rgba(167,139,250,0.15)] border border-[rgba(167,139,250,0.35)] shadow-sm"
                      : "text-[#8B919C] hover:text-white border border-transparent"
                  }`}
                >
                  PM
                </button>
              </div>
            </div>
          </div>

          {/* Footer Actions */}
          <div className="flex items-center justify-between pt-1">
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleClear}
                className="text-[11px] font-mono text-[#8B919C] hover:text-white transition-colors"
              >
                Clear
              </button>
              <span className="text-[#333333]">·</span>
              <button
                type="button"
                onClick={handleToday}
                className="text-[11px] font-mono text-[#00D9FF] hover:text-[#00D9FF]/80 transition-colors"
              >
                Today
              </button>
            </div>

            <button
              type="button"
              onClick={() => setIsOpen(false)}
              className="px-3 py-1 rounded-lg text-xs font-semibold text-white bg-white/10 hover:bg-white/20 transition-colors"
            >
              Done
            </button>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
}
