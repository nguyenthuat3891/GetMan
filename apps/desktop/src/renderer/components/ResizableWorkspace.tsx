import { useEffect, useMemo, useRef, useState } from "react";
import type { CSSProperties, PointerEvent as ReactPointerEvent } from "react";
import { RequestBuilder } from "./RequestBuilder";
import { ResponseViewer } from "./ResponseViewer";
import { Sidebar } from "./Sidebar";

interface LayoutState {
  sidebarWidth: number;
  requestHeight: number;
}

const STORAGE_KEY = "getman.layout.v4";
const MIN_REQUEST_PX = 250;
const MIN_RESPONSE_PX = 250;
const defaultLayout: LayoutState = { sidebarWidth: 304, requestHeight: 400 };

export function ResizableWorkspace() {
  const [layout, setLayout] = useState<LayoutState>(() => readLayout());
  const workspaceRef = useRef<HTMLElement>(null);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(layout));
  }, [layout]);

  useEffect(() => {
    // Clamp on mount to fix stale stored values (e.g. saved at larger viewport)
    const el = workspaceRef.current;
    if (el) {
      const max = el.offsetHeight - 6 - MIN_RESPONSE_PX;
      setLayout((l) => {
        const requestHeight = clamp(l.requestHeight, MIN_REQUEST_PX, max);
        return requestHeight === l.requestHeight ? l : { ...l, requestHeight };
      });
    }

    const onResize = () => {
      const el = workspaceRef.current;
      if (!el) return;
      const max = el.offsetHeight - 6 - MIN_RESPONSE_PX;
      setLayout((l) => {
        const requestHeight = clamp(l.requestHeight, MIN_REQUEST_PX, max);
        return requestHeight === l.requestHeight ? l : { ...l, requestHeight };
      });
    };
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  const style = useMemo(
    () =>
      ({
        "--sidebar-width": `${layout.sidebarWidth}px`,
        "--request-height": `${layout.requestHeight}px`
      }) as CSSProperties,
    [layout]
  );

  const startResize = (target: "sidebar" | "split", event: ReactPointerEvent<HTMLDivElement>) => {
    event.preventDefault();
    const startX = event.clientX;
    const startY = event.clientY;
    const startLayout = layout;
    const el = workspaceRef.current;
    let currentSidebarWidth = startLayout.sidebarWidth;
    let currentRequestHeight = startLayout.requestHeight;

    const onPointerMove = (moveEvent: PointerEvent) => {
      if (!el) return;

      if (target === "sidebar") {
        currentSidebarWidth = clamp(startLayout.sidebarWidth + moveEvent.clientX - startX, 236, 460);
        el.style.setProperty("--sidebar-width", `${currentSidebarWidth}px`);
        return;
      }

      // pixel-based split: request builder has fixed height, response gets the rest via 1fr
      const available = el.offsetHeight - 6; // 6px for the handle itself
      currentRequestHeight = clamp(
        startLayout.requestHeight + (moveEvent.clientY - startY),
        MIN_REQUEST_PX,
        available - MIN_RESPONSE_PX
      );
      el.style.setProperty("--request-height", `${currentRequestHeight}px`);
    };

    const onPointerUp = () => {
      document.body.classList.remove("is-resizing");
      window.removeEventListener("pointermove", onPointerMove);
      window.removeEventListener("pointerup", onPointerUp);
      if (target === "sidebar") {
        setLayout((l) => ({ ...l, sidebarWidth: currentSidebarWidth }));
      } else {
        setLayout((l) => ({ ...l, requestHeight: currentRequestHeight }));
      }
    };

    document.body.classList.add("is-resizing");
    window.addEventListener("pointermove", onPointerMove);
    window.addEventListener("pointerup", onPointerUp);
  };

  return (
    <main ref={workspaceRef} className="workspace-layout" style={style}>
      <Sidebar />
      <div className="resize-handle resize-sidebar" onPointerDown={(e) => startResize("sidebar", e)} />
      <section className="main-split">
        <RequestBuilder />
        <div className="resize-handle resize-response-y" onPointerDown={(e) => startResize("split", e)} />
        <ResponseViewer />
      </section>
    </main>
  );
}

function readLayout(): LayoutState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return defaultLayout;
    const parsed = JSON.parse(raw) as Partial<LayoutState>;
    return {
      sidebarWidth: clamp(parsed.sidebarWidth ?? defaultLayout.sidebarWidth, 236, 460),
      requestHeight: clamp(parsed.requestHeight ?? defaultLayout.requestHeight, MIN_REQUEST_PX, 9999)
    };
  } catch {
    return defaultLayout;
  }
}

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}
