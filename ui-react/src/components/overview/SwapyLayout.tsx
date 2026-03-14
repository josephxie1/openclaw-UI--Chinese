import React, { useEffect, useRef } from "react";
import { createSwapy } from "swapy";
import type { Swapy } from "swapy";

const STORAGE_KEY = "oc-overview-card-order-v3";

/**
 * React wrapper for swapy drag-to-reorder layout.
 * Card order is persisted in localStorage.
 */
export function SwapyLayout({ children }: { children: React.ReactNode }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const swapyRef = useRef<Swapy | null>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    // Wait for children to render
    const raf = requestAnimationFrame(() => {
      const swapyEl = container.querySelector(".overview-swapy");
      if (!swapyEl) return;

      swapyRef.current = createSwapy(swapyEl as HTMLElement, {
        swapMode: "hover",
        animation: "dynamic",
        autoScrollOnDrag: true,
      });

      swapyRef.current.onSwapEnd((event) => {
        if (event.hasChanged) {
          localStorage.setItem(STORAGE_KEY, JSON.stringify(event.slotItemMap.asArray));
        }
      });
    });

    return () => {
      cancelAnimationFrame(raf);
      swapyRef.current?.destroy();
      swapyRef.current = null;
    };
  }, []);

  // Update swapy when children change
  useEffect(() => {
    const timer = setTimeout(() => {
      swapyRef.current?.update();
    }, 100);
    return () => clearTimeout(timer);
  }, [children]);

  return <div ref={containerRef}>{children}</div>;
}

/**
 * Resolve saved card order from localStorage.
 */
export function getSavedCardOrder(defaultOrder: string[]): string[] {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      const parsed = JSON.parse(saved) as Array<{ slot: string; item: string }>;
      const order = parsed.map((e) => e.item);
      if (order.length === defaultOrder.length && order.every((s) => defaultOrder.includes(s))) {
        return order;
      }
    }
  } catch { /* use default */ }
  return defaultOrder;
}
