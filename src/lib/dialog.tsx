"use client";
import React, { createContext, useContext, useState, useEffect, useRef, useCallback } from "react";
import { clsx } from "clsx";

export type DialogType = "success" | "error" | "warning" | "info" | "confirm";

export interface DialogOptions {
  type?: DialogType;
  title?: string;
  message: React.ReactNode;
  confirmText?: string;
  cancelText?: string;
  isDestructive?: boolean;
}

interface DialogState extends DialogOptions {
  id: number;
  resolve: (value: boolean) => void;
}

type DialogListener = (state: DialogState | null) => void;

let currentDialogListener: DialogListener | null = null;
let dialogIdCounter = 1;

export const dialog = {
  alert: (options: DialogOptions | string): Promise<void> => {
    const opts: DialogOptions = typeof options === "string" ? { message: options, type: "info" } : options;
    return new Promise<void>((resolve) => {
      if (!currentDialogListener) {
        // Fallback if rendered before provider
        resolve();
        return;
      }
      currentDialogListener({
        ...opts,
        type: opts.type || "info",
        id: ++dialogIdCounter,
        resolve: () => resolve(),
      });
    });
  },

  success: (messageOrOptions: string | Omit<DialogOptions, "type">): Promise<void> => {
    const opts: DialogOptions =
      typeof messageOrOptions === "string"
        ? { message: messageOrOptions, title: "Success", type: "success" }
        : { ...messageOrOptions, title: messageOrOptions.title || "Success", type: "success" };
    return dialog.alert(opts);
  },

  error: (messageOrOptions: string | Omit<DialogOptions, "type">): Promise<void> => {
    const opts: DialogOptions =
      typeof messageOrOptions === "string"
        ? { message: messageOrOptions, title: "Something went wrong", type: "error" }
        : { ...messageOrOptions, title: messageOrOptions.title || "Something went wrong", type: "error" };
    return dialog.alert(opts);
  },

  warning: (messageOrOptions: string | Omit<DialogOptions, "type">): Promise<void> => {
    const opts: DialogOptions =
      typeof messageOrOptions === "string"
        ? { message: messageOrOptions, title: "Warning", type: "warning" }
        : { ...messageOrOptions, title: messageOrOptions.title || "Warning", type: "warning" };
    return dialog.alert(opts);
  },

  info: (messageOrOptions: string | Omit<DialogOptions, "type">): Promise<void> => {
    const opts: DialogOptions =
      typeof messageOrOptions === "string"
        ? { message: messageOrOptions, title: "Information", type: "info" }
        : { ...messageOrOptions, title: messageOrOptions.title || "Information", type: "info" };
    return dialog.alert(opts);
  },

  confirm: (options: DialogOptions | string): Promise<boolean> => {
    const opts: DialogOptions =
      typeof options === "string"
        ? { message: options, title: "Confirm Action", type: "confirm" }
        : { ...options, title: options.title || "Confirm Action", type: "confirm" };

    return new Promise<boolean>((resolve) => {
      if (!currentDialogListener) {
        resolve(false);
        return;
      }
      currentDialogListener({
        ...opts,
        type: "confirm",
        id: ++dialogIdCounter,
        resolve,
      });
    });
  },
};

const DialogContext = createContext<{
  dialog: typeof dialog;
}>({ dialog });

export function useDialog() {
  return useContext(DialogContext);
}

export function DialogProvider({ children }: { children: React.ReactNode }) {
  const [current, setCurrent] = useState<DialogState | null>(null);
  const confirmBtnRef = useRef<HTMLButtonElement>(null);
  const cancelBtnRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    currentDialogListener = (state) => setCurrent(state);

    // Override browser native alert to ensure consistent HireDesk modals everywhere
    if (typeof window !== "undefined") {
      const origAlert = window.alert;
      window.alert = (msg?: any) => {
        dialog.info({ message: String(msg ?? "") });
      };
      return () => {
        currentDialogListener = null;
        window.alert = origAlert;
      };
    }

    return () => {
      currentDialogListener = null;
    };
  }, []);

  const handleClose = useCallback(
    (confirmed: boolean) => {
      if (!current) return;
      const { resolve } = current;
      setCurrent(null);
      resolve(confirmed);
    },
    [current]
  );

  // Keyboard accessibility
  useEffect(() => {
    if (!current) return;

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        handleClose(false);
      }
    };

    window.addEventListener("keydown", onKeyDown);

    // Focus management
    const timer = setTimeout(() => {
      if (current.type === "confirm" && current.isDestructive) {
        cancelBtnRef.current?.focus();
      } else {
        confirmBtnRef.current?.focus();
      }
    }, 50);

    return () => {
      window.removeEventListener("keydown", onKeyDown);
      clearTimeout(timer);
    };
  }, [current, handleClose]);

  const isConfirm = current?.type === "confirm";
  const isDestructive = current?.isDestructive ?? false;

  // Title icon & color configuration
  const iconConfig = (() => {
    if (!current) return null;
    if (isConfirm) {
      if (isDestructive) {
        return {
          color: "#EF4444",
          icon: (
            <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="#EF4444" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" className="shrink-0">
              <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
              <line x1="12" y1="9" x2="12" y2="13" />
              <line x1="12" y1="17" x2="12.01" y2="17" />
            </svg>
          ),
        };
      }
      return {
        color: "#00D9FF",
        icon: (
          <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="#00D9FF" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" className="shrink-0">
            <circle cx="12" cy="12" r="10" />
            <line x1="12" y1="16" x2="12" y2="12" />
            <line x1="12" y1="8" x2="12.01" y2="8" />
          </svg>
        ),
      };
    }

    switch (current.type) {
      case "success":
        return {
          color: "#22C55E",
          icon: (
            <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="#22C55E" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" className="shrink-0">
              <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
              <polyline points="22 4 12 14.01 9 11.01" />
            </svg>
          ),
        };
      case "error":
        return {
          color: "#EF4444",
          icon: (
            <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="#EF4444" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" className="shrink-0">
              <circle cx="12" cy="12" r="10" />
              <line x1="15" y1="9" x2="9" y2="15" />
              <line x1="9" y1="9" x2="15" y2="15" />
            </svg>
          ),
        };
      case "warning":
        return {
          color: "#F5C542",
          icon: (
            <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="#F5C542" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" className="shrink-0">
              <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
              <line x1="12" y1="9" x2="12" y2="13" />
              <line x1="12" y1="17" x2="12.01" y2="17" />
            </svg>
          ),
        };
      case "info":
      default:
        return {
          color: "#00D9FF",
          icon: (
            <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="#00D9FF" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" className="shrink-0">
              <circle cx="12" cy="12" r="10" />
              <line x1="12" y1="16" x2="12" y2="12" />
              <line x1="12" y1="8" x2="12.01" y2="8" />
            </svg>
          ),
        };
    }
  })();

  const defaultTitle = (() => {
    if (!current) return "";
    if (current.title) return current.title;
    if (isConfirm) return isDestructive ? "Confirm Deletion" : "Confirm Action";
    switch (current.type) {
      case "success":
        return "Success";
      case "error":
        return "Something went wrong";
      case "warning":
        return "Warning";
      case "info":
      default:
        return "Information";
    }
  })();

  return (
    <DialogContext.Provider value={{ dialog }}>
      {children}

      {current && (
        <div
          className="fixed inset-0 z-[99999] flex items-center justify-center p-4 bg-black/65 backdrop-blur-[3px] animate-dialog-backdrop select-none"
          onClick={(e) => {
            // Only close on backdrop click for non-destructive dialogs
            if (e.target === e.currentTarget && !isDestructive) {
              handleClose(false);
            }
          }}
          role="dialog"
          aria-modal="true"
          aria-labelledby="hiredesk-dialog-title"
          aria-describedby="hiredesk-dialog-desc"
        >
          <div
            className="bg-[#111315] border border-[#292D33] rounded-[14px] p-5 sm:p-6 shadow-[0_16px_40px_rgba(0,0,0,0.65)] animate-dialog-modal overflow-hidden"
            style={{ width: "min(420px, 90vw)", maxWidth: "420px" }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header: Icon + Title */}
            <div className="flex items-center gap-2.5">
              <div className="shrink-0 flex items-center justify-center">
                {iconConfig?.icon}
              </div>
              <h3
                id="hiredesk-dialog-title"
                className="text-[16.5px] font-semibold text-[#E7E9ED] leading-snug tracking-tight"
              >
                {defaultTitle}
              </h3>
            </div>

            {/* Description / Message Body */}
            <div
              id="hiredesk-dialog-desc"
              className="text-[13.5px] leading-relaxed text-[#9A9FA8] mt-2.5 pl-[28px] break-words select-text"
            >
              {current.message}
            </div>

            {/* Action Buttons */}
            <div className="flex justify-end items-center gap-2.5 mt-5">
              {isConfirm && (
                <button
                  ref={cancelBtnRef}
                  type="button"
                  onClick={() => handleClose(false)}
                  className="h-[36px] px-3.5 rounded-[8px] text-[15px] font-semibold uppercase tracking-wider bg-[#151719] border border-[#343941] text-[#D1D5DB] hover:bg-[#1D2024] hover:text-[#E7E9ED] hover:border-[#444A54] transition-all duration-150 cursor-pointer inline-flex items-center justify-center active:scale-[0.98]"
                >
                  {current.cancelText || "Cancel"}
                </button>
              )}

              <button
                ref={confirmBtnRef}
                type="button"
                onClick={() => handleClose(true)}
                className={clsx(
                  "min-w-[78px] h-[36px] px-3.5 rounded-[8px] text-[15px] font-semibold uppercase tracking-wider transition-all duration-150 cursor-pointer inline-flex items-center justify-center active:scale-[0.98]",
                  isConfirm
                    ? isDestructive
                      ? "bg-red-500/10 border border-[#EF4444] text-[#EF4444] hover:bg-red-500/20"
                      : "bg-[#00D9FF]/10 border border-[#00D9FF] text-[#00D9FF] hover:bg-[#00D9FF]/20"
                    : current.type === "success"
                    ? "bg-transparent border border-[#22C55E] text-[#22C55E] hover:bg-[#22C55E]/10"
                    : current.type === "error"
                    ? "bg-transparent border border-[#EF4444] text-[#EF4444] hover:bg-[#EF4444]/10"
                    : current.type === "warning"
                    ? "bg-transparent border border-[#F5C542] text-[#F5C542] hover:bg-[#F5C542]/10"
                    : "bg-transparent border border-[#00D9FF] text-[#00D9FF] hover:bg-[#00D9FF]/10"
                )}
              >
                {current.confirmText || (isConfirm ? (isDestructive ? "Delete" : "Confirm") : "OK")}
              </button>
            </div>
          </div>
        </div>
      )}
    </DialogContext.Provider>
  );
}
