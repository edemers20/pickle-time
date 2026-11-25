"use client";

import { useEffect, useRef, useState } from "react";
import { ArrowLeft } from "lucide-react";
import { cn } from "@/lib/utils";

export function PopupSheet({
  open,
  onClose,
  label,
  testId,
  backTestId,
  children,
}: {
  open: boolean;
  onClose: () => void;
  label: string;
  testId: string;
  backTestId: string;
  children: React.ReactNode;
}) {
  const [mounted, setMounted] = useState(open);
  const [closing, setClosing] = useState(false);
  const backRef = useRef<HTMLButtonElement>(null);

  if (open && !mounted) {
    setMounted(true);
    setClosing(false);
  }

  useEffect(() => {
    if (open || !mounted) return;
    const start = window.requestAnimationFrame(() => setClosing(true));
    const timer = window.setTimeout(() => {
      setMounted(false);
      setClosing(false);
    }, 160);
    return () => {
      window.cancelAnimationFrame(start);
      window.clearTimeout(timer);
    };
  }, [open, mounted]);

  useEffect(() => {
    if (!mounted || closing) return;
    backRef.current?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [mounted, closing, onClose]);

  if (!mounted) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={label}
      data-testid={testId}
      className={cn("fixed inset-0 z-50 overflow-hidden overscroll-none bg-background md:bg-black/60 md:p-6", closing ? "fade-out" : "fade-in")}
    >
      <div className={cn("flex h-full flex-col overflow-hidden bg-background md:mx-auto md:max-w-3xl md:rounded-2xl", closing ? "popup-out" : "popup-in")}>
        <div className="flex items-center px-4 py-3">
          <button
            ref={backRef}
            type="button"
            data-testid={backTestId}
            onClick={onClose}
            className="inline-flex items-center gap-1 text-sm font-medium text-foreground"
          >
            <ArrowLeft className="size-4" /> Back
          </button>
        </div>
        <div className="flex-1 overflow-y-auto px-4 py-5">{children}</div>
      </div>
    </div>
  );
}
