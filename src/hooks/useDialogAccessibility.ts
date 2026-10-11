import { RefObject, useEffect, useRef } from "react";

const FOCUSABLE_SELECTOR = [
  "a[href]:not([aria-disabled='true'])",
  "button:not([disabled]):not([aria-disabled='true'])",
  "input:not([disabled]):not([type='hidden']):not([aria-disabled='true'])",
  "select:not([disabled]):not([aria-disabled='true'])",
  "textarea:not([disabled]):not([aria-disabled='true'])",
  "[tabindex]:not([tabindex='-1']):not([aria-disabled='true'])"
].join(",");

/** Adds initial focus, Escape-to-close, focus trapping, and focus restoration to a modal. */
export function useDialogAccessibility(
  isOpen: boolean,
  dialogRef: RefObject<HTMLElement | null>,
  onClose: () => void
): void {
  const onCloseRef = useRef(onClose);
  onCloseRef.current = onClose;

  useEffect(() => {
    if (!isOpen || !dialogRef.current) return;

    const dialog = dialogRef.current;
    const previousFocus = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    const focusable = () => Array.from(dialog.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR))
      .filter((element) => {
        if (element.getAttribute("aria-hidden") === "true") return false;
        if (element.closest("[hidden], [inert]")) return false;
        return element.getClientRects().length > 0;
      });

    const initialFocus = dialog.querySelector<HTMLElement>("[autofocus]") ?? focusable()[0] ?? dialog;
    initialFocus.focus();

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        onCloseRef.current();
        return;
      }
      if (event.key !== "Tab") return;
      const items = focusable();
      if (items.length === 0) {
        event.preventDefault();
        dialog.focus();
        return;
      }
      const first = items[0];
      const last = items[items.length - 1];
      if (event.shiftKey && (document.activeElement === first || !dialog.contains(document.activeElement))) {
        event.preventDefault();
        last?.focus();
      } else if (!event.shiftKey && (document.activeElement === last || !dialog.contains(document.activeElement))) {
        event.preventDefault();
        first?.focus();
      }
    };

    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("keydown", onKeyDown);
      if (previousFocus?.isConnected) previousFocus.focus();
    };
  }, [isOpen, dialogRef]);
}
