import { useEffect, useRef, type ReactNode } from "react";
import type { FetcherWithComponents } from "react-router";

import { Button } from "./Button";

type ModalProps<TData> = {
  open: boolean;
  title: string;
  onClose: () => void;
  fetcher: FetcherWithComponents<TData>;
  submitLabel?: string;
  children: ReactNode;
};

const FOCUSABLE_SELECTOR =
  'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])';

/**
 * The one reusable modal — takes a title, form fields as children, and the
 * caller's fetcher (so submission goes through that route's action). Traps
 * focus, closes on Escape, and restores focus to whatever triggered it.
 */
export function Modal<TData>({
  open,
  title,
  onClose,
  fetcher,
  submitLabel = "Save",
  children,
}: ModalProps<TData>) {
  const dialogRef = useRef<HTMLDivElement>(null);
  const lastFocusedRef = useRef<HTMLElement | null>(null);
  const pending = fetcher.state !== "idle";

  useEffect(() => {
    if (!open) return;

    lastFocusedRef.current = document.activeElement as HTMLElement | null;
    const dialog = dialogRef.current;
    const focusable = dialog?.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR);
    focusable?.[0]?.focus();

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        event.preventDefault();
        onClose();
        return;
      }
      if (event.key !== "Tab" || !dialog) return;

      const elements = Array.from(
        dialog.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR),
      );
      if (elements.length === 0) return;
      const first = elements[0];
      const last = elements[elements.length - 1];

      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    }

    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      lastFocusedRef.current?.focus();
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-foreground/40 p-4"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="modal-title"
        className="w-full max-w-sm rounded-2xl bg-card p-6 shadow-2xl"
      >
        <h2 id="modal-title" className="mb-4 font-serif text-lg font-bold">
          {title}
        </h2>
        <fetcher.Form method="post" className="flex flex-col gap-3">
          {children}
          <div className="mt-2 flex justify-end gap-2.5">
            <Button type="button" variant="secondary" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={pending}>
              {pending ? "Saving…" : submitLabel}
            </Button>
          </div>
        </fetcher.Form>
      </div>
    </div>
  );
}
