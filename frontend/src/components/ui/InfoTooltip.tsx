import { useState, useRef, useEffect } from "react";
import { Info } from "lucide-react";

interface Props {
  children: React.ReactNode;
}

export function InfoTooltip({ children }: Props) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open]);

  return (
    <span className="relative inline-flex" ref={ref}>
      <button
        onClick={() => setOpen(!open)}
        className="ml-1.5 inline-flex h-4 w-4 items-center justify-center rounded-full text-slate-300 hover:text-slate-500 hover:bg-slate-100 transition-colors"
        aria-label="How is this calculated?"
      >
        <Info className="h-3.5 w-3.5" />
      </button>
      {open && (
        <div className="absolute left-0 top-6 z-50 w-[380px] rounded-lg border border-slate-200 bg-white p-4 shadow-lg text-xs text-slate-600 leading-relaxed space-y-2">
          {children}
        </div>
      )}
    </span>
  );
}
